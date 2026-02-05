import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { skills, skillVersions, skillFiles, users } from "../shared/schema.js";
import * as https from "https";
import * as fs from "fs";

interface SkillToImport {
  slug: string;
  name: string;
  description: string;
}

// Load skills from scraped file
function loadSkillsFromFile(): SkillToImport[] {
  const content = fs.readFileSync("scripts/all-skills.txt", "utf-8");
  const skills: SkillToImport[] = [];
  
  const lines = content.split("\n").filter(l => l.trim());
  for (const line of lines) {
    const match = line.match(/slug:\s*"([^"]+)"/);
    if (match) {
      const slug = match[1];
      skills.push({
        slug,
        name: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        description: ""
      });
    }
  }
  return skills;
}

interface ValidationResult {
  passed: boolean;
  checks: { name: string; passed: boolean; message: string }[];
}

function validateSkillContent(content: string, slug: string): ValidationResult {
  const checks: { name: string; passed: boolean; message: string }[] = [];
  
  // Check 1: Content length
  const minLength = 500;
  const lengthCheck = content.length >= minLength;
  checks.push({
    name: "content_length",
    passed: lengthCheck,
    message: lengthCheck ? `Content is ${content.length} bytes` : `Content too short: ${content.length} bytes (min ${minLength})`
  });
  
  // Check 2: No legacy mentions
  const legacyPatterns = [/skillbook/i, /skill\.book/i];
  const hasLegacy = legacyPatterns.some(p => p.test(content));
  checks.push({
    name: "no_legacy_mentions",
    passed: !hasLegacy,
    message: hasLegacy ? "Contains legacy mentions" : "No legacy mentions found"
  });
  
  // Check 3: Has valid YAML frontmatter
  const hasFrontmatter = content.startsWith("---") && content.includes("---", 4);
  checks.push({
    name: "valid_frontmatter",
    passed: hasFrontmatter,
    message: hasFrontmatter ? "Valid YAML frontmatter" : "Missing YAML frontmatter"
  });
  
  // Check 4: Has markdown heading
  const hasHeading = /^#\s+.+/m.test(content);
  checks.push({
    name: "has_heading",
    passed: hasHeading,
    message: hasHeading ? "Has markdown heading" : "Missing markdown heading"
  });
  
  // Critical checks (must pass)
  const criticalChecks = ["content_length", "no_legacy_mentions", "valid_frontmatter"];
  const passed = checks.filter(c => criticalChecks.includes(c.name)).every(c => c.passed);
  
  return { passed, checks };
}

async function downloadSkillContent(slug: string): Promise<{ content: string; files: Map<string, string> } | null> {
  const url = `https://clawhub.ai/api/skills/${slug}/files`;
  
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const files = new Map<string, string>();
          
          if (json.files && Array.isArray(json.files)) {
            for (const file of json.files) {
              if (file.path && file.content) {
                files.set(file.path, file.content);
              }
            }
          }
          
          const skillMd = files.get("SKILL.md") || "";
          resolve({ content: skillMd, files });
        } catch {
          resolve(null);
        }
      });
    });
    
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

async function main() {
  console.log("=== Mass Skill Import ===\n");
  
  // Get skillhub user
  const [user] = await db.select().from(users).where(eq(users.handle, "skillhub"));
  if (!user) {
    console.error("User 'skillhub' not found!");
    process.exit(1);
  }
  console.log(`User: ${user.handle} (${user.id})\n`);
  
  // Get already imported skills
  const existingSkills = await db.select({ slug: skills.slug }).from(skills)
    .where(eq(skills.ownerId, user.id));
  const existingSlugs = new Set(existingSkills.map(s => s.slug));
  console.log(`Already imported: ${existingSlugs.size} skills\n`);
  
  // Load all skills from file
  const allSkills = loadSkillsFromFile();
  console.log(`Total skills in file: ${allSkills.length}\n`);
  
  // Filter out already imported
  const toImport = allSkills.filter(s => !existingSlugs.has(s.slug));
  console.log(`Skills to import: ${toImport.length}\n`);
  
  let imported = 0;
  let failed = 0;
  let skipped = 0;
  
  // Process in batches
  const BATCH_SIZE = 50;
  const MAX_IMPORTS = 500; // Limit per run
  
  for (let i = 0; i < Math.min(toImport.length, MAX_IMPORTS); i++) {
    const skill = toImport[i];
    
    process.stdout.write(`[${i + 1}/${Math.min(toImport.length, MAX_IMPORTS)}] ${skill.slug}... `);
    
    // Download content
    const result = await downloadSkillContent(skill.slug);
    if (!result || !result.content) {
      console.log("SKIP (no content)");
      skipped++;
      continue;
    }
    
    // Validate
    const validation = validateSkillContent(result.content, skill.slug);
    if (!validation.passed) {
      const failedCheck = validation.checks.find(c => !c.passed);
      console.log(`SKIP (${failedCheck?.name})`);
      skipped++;
      continue;
    }
    
    try {
      // Create skill
      const [newSkill] = await db.insert(skills).values({
        id: crypto.randomUUID(),
        name: skill.name,
        slug: skill.slug,
        description: skill.description || result.content.substring(0, 200),
        ownerId: user.id,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      // Create version
      const [newVersion] = await db.insert(skillVersions).values({
        skillId: newSkill.id,
        version: "1.0.0",
        skillMd: result.content,
        changelog: "Imported from ClawHub registry",
        isLatest: true,
      }).returning();
      
      // Create files
      for (const [path, content] of result.files) {
        await db.insert(skillFiles).values({
          versionId: newVersion.id,
          path,
          content,
          size: content.length,
          mimeType: path.endsWith(".md") ? "text/markdown" : "text/plain",
        });
      }
      
      console.log(`OK (${result.files.size} files)`);
      imported++;
    } catch (e: any) {
      console.log(`ERROR: ${e.message?.substring(0, 50)}`);
      failed++;
    }
    
    // Small delay to avoid rate limiting
    if (i % 10 === 0) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log(`\n=== Import Complete ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nRun again to continue importing more skills.`);
}

main().catch(console.error);

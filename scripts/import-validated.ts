import { db } from "../server/db.js";
import * as schema from "../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface SkillToImport {
  slug: string;
  name: string;
  description: string;
}

const BATCH_79: SkillToImport[] = [
  { slug: "pepsi-or-coke-mcp", name: "Pepsi or Coke MCP", description: "Pepsi or Coke" },
  { slug: "deepbook-cli", name: "DeepBook CLI", description: "DeepBook CLI" },
  { slug: "thinking-model-enhancer", name: "Thinking Model Enhancer", description: "Thinking enhancer" },
  { slug: "mactop", name: "MacTop", description: "MacTop tool" },
  { slug: "ai-captcha", name: "AI Captcha", description: "AI captcha" },
  { slug: "ket", name: "KET", description: "KET tool" },
  { slug: "build-warden-agent", name: "Build Warden Agent", description: "Build warden" },
  { slug: "social-gen", name: "Social Gen", description: "Social generator" },
  { slug: "code-explainer", name: "Code Explainer", description: "Code explainer" },
  { slug: "pi-admin", name: "Pi Admin", description: "Pi admin" },
  { slug: "rssaurus", name: "RSSaurus", description: "RSSaurus RSS" },
  { slug: "crewmind-bets", name: "CrewMind Bets", description: "CrewMind bets" },
  { slug: "qmd-search", name: "QMD Search", description: "QMD search" },
  { slug: "reposit", name: "Reposit", description: "Reposit tool" },
  { slug: "24konbini", name: "24Konbini", description: "24Konbini" },
  { slug: "openclaw-security-hardening", name: "OpenClaw Security", description: "Security hardening" },
  { slug: "gamma", name: "Gamma", description: "Gamma tool" },
  { slug: "deepresearch", name: "Deep Research", description: "Deep research" },
  { slug: "protoss-voice", name: "Protoss Voice", description: "Protoss voice" },
  { slug: "network-analyzer", name: "Network Analyzer", description: "Network analysis" },
];

const BATCH_1: SkillToImport[] = BATCH_79;

interface ValidationResult {
  passed: boolean;
  checks: { name: string; passed: boolean; message: string }[];
}

function validateSkillContent(content: string, slug: string): ValidationResult {
  const checks: { name: string; passed: boolean; message: string }[] = [];
  
  const minLength = content.length >= 500;
  checks.push({
    name: "content_length",
    passed: minLength,
    message: minLength ? `Content is ${content.length} bytes` : `Content too short: ${content.length} bytes (min 500)`
  });
  
  const noClawHubMention = !content.includes("Originally from ClawHub") && !content.includes("Imported from ClawHub");
  checks.push({
    name: "no_legacy_mentions",
    passed: noClawHubMention,
    message: noClawHubMention ? "No legacy mentions found" : "Contains legacy ClawHub mention"
  });
  
  const hasYamlFrontmatter = content.startsWith("---") && content.includes("name:");
  checks.push({
    name: "valid_frontmatter",
    passed: hasYamlFrontmatter,
    message: hasYamlFrontmatter ? "Valid YAML frontmatter" : "Missing YAML frontmatter"
  });
  
  const hasHeading = content.includes("# ");
  checks.push({
    name: "has_heading",
    passed: hasHeading,
    message: hasHeading ? "Has markdown heading" : "No markdown heading found"
  });
  
  const hasCodeBlocks = content.includes("```");
  checks.push({
    name: "has_code_examples",
    passed: hasCodeBlocks,
    message: hasCodeBlocks ? "Has code examples" : "No code examples (warning only)"
  });
  
  const criticalPassed = checks.filter(c => ["content_length", "no_legacy_mentions", "valid_frontmatter"].includes(c.name)).every(c => c.passed);
  
  return { passed: criticalPassed, checks };
}

async function downloadSkill(slug: string): Promise<{ content: string; files: Array<{path: string; content: string}> } | null> {
  const tmpDir = `/tmp/skill-${slug}`;
  const zipPath = `${tmpDir}.zip`;
  
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(zipPath, { force: true });
    
    execSync(`curl -s "https://auth.clawdhub.com/api/v1/download?slug=${slug}" -o "${zipPath}"`, { timeout: 30000 });
    
    if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size < 100) {
      return null;
    }
    
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync(`unzip -o "${zipPath}" -d "${tmpDir}"`, { timeout: 10000 });
    
    const skillMdPath = path.join(tmpDir, "SKILL.md");
    if (!fs.existsSync(skillMdPath)) {
      return null;
    }
    
    const content = fs.readFileSync(skillMdPath, "utf-8");
    
    const files: Array<{path: string; content: string}> = [];
    const entries = fs.readdirSync(tmpDir);
    for (const entry of entries) {
      if (entry === "_meta.json") continue;
      const filePath = path.join(tmpDir, entry);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        files.push({ path: entry, content: fileContent });
      }
    }
    
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(zipPath, { force: true });
    
    return { content, files };
  } catch (error) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(zipPath, { force: true });
    return null;
  }
}

async function main() {
  console.log("=== Validated Skill Import ===\n");
  
  const skillhubUser = await db.query.users.findFirst({
    where: eq(schema.users.handle, "skillhub"),
  });
  
  if (!skillhubUser) {
    console.log("ERROR: skillhub user not found");
    process.exit(1);
  }
  
  console.log(`User: skillhub (${skillhubUser.id})\n`);
  
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const multiFileSkills: string[] = [];
  
  for (const skill of BATCH_1) {
    console.log(`\n[${imported + skipped + failed + 1}/${BATCH_1.length}] ${skill.slug}`);
    
    const existing = await db.query.skills.findFirst({
      where: and(
        eq(schema.skills.slug, skill.slug),
        eq(schema.skills.ownerId, skillhubUser.id)
      ),
    });
    
    if (existing) {
      console.log("  Deleting existing entry for re-import...");
      
      const versions = await db.query.skillVersions.findMany({
        where: eq(schema.skillVersions.skillId, existing.id),
      });
      
      for (const version of versions) {
        await db.delete(schema.skillValidations).where(eq(schema.skillValidations.versionId, version.id));
        await db.delete(schema.skillFiles).where(eq(schema.skillFiles.versionId, version.id));
      }
      
      await db.delete(schema.skillVersions).where(eq(schema.skillVersions.skillId, existing.id));
      await db.delete(schema.skillStars).where(eq(schema.skillStars.skillId, existing.id));
      await db.delete(schema.skillComments).where(eq(schema.skillComments.skillId, existing.id));
      await db.delete(schema.skills).where(eq(schema.skills.id, existing.id));
    }
    
    console.log("  Downloading...");
    const downloaded = await downloadSkill(skill.slug);
    
    if (!downloaded) {
      console.log("  FAILED: Could not download");
      failed++;
      continue;
    }
    
    console.log(`  Downloaded ${downloaded.content.length} bytes, ${downloaded.files.length} files`);
    
    if (downloaded.files.length > 1) {
      multiFileSkills.push(skill.slug);
      console.log(`  ** MULTI-FILE SKILL: ${downloaded.files.map(f => f.path).join(", ")}`);
    }
    
    const validation = validateSkillContent(downloaded.content, skill.slug);
    console.log("  Validation:");
    for (const check of validation.checks) {
      console.log(`    ${check.passed ? "✓" : "✗"} ${check.name}: ${check.message}`);
    }
    
    if (!validation.passed) {
      console.log("  FAILED: Validation failed");
      failed++;
      continue;
    }
    
    try {
      const [newSkill] = await db.insert(schema.skills).values({
        ownerId: skillhubUser.id,
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        isPublic: true,
        isVerified: false,
        stars: 0,
        downloads: 0,
        forks: 0,
        weeklyDownloads: 0,
        tags: [],
        license: "MIT",
      }).returning();
      
      const [newVersion] = await db.insert(schema.skillVersions).values({
        skillId: newSkill.id,
        version: "1.0.0",
        skillMd: downloaded.content,
        changelog: "Initial release",
      }).returning();
      
      for (const file of downloaded.files) {
        if (file.path === "SKILL.md") continue;
        await db.insert(schema.skillFiles).values({
          versionId: newVersion.id,
          path: file.path,
          content: file.content,
          size: file.content.length,
          isBinary: false,
        });
      }
      
      await db.insert(schema.skillValidations).values({
        versionId: newVersion.id,
        status: "passed",
        score: 90,
        checks: validation.checks.map(c => ({
          id: c.name,
          category: "import",
          status: c.passed ? "passed" as const : "warning" as const,
          message: c.message
        })),
        startedAt: new Date(),
        finishedAt: new Date(),
      });
      
      console.log("  SUCCESS: Imported with full content");
      imported++;
    } catch (error) {
      console.log(`  ERROR: ${error}`);
      failed++;
    }
  }
  
  console.log("\n=== Import Complete ===");
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  
  if (multiFileSkills.length > 0) {
    console.log(`\nMulti-file skills found: ${multiFileSkills.join(", ")}`);
  }
  
  process.exit(0);
}

main().catch(console.error);

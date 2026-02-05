import { chromium, Browser, Page } from "playwright";
import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { skills, skillVersions, skillFiles, users } from "../shared/schema.js";
import * as fs from "fs";

interface SkillToImport {
  slug: string;
  owner: string;
  name: string;
}

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
        owner: "unknown",
        name: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      });
    }
  }
  return skills;
}

function validateSkillContent(content: string): { passed: boolean; reason: string } {
  if (content.length < 500) return { passed: false, reason: "too_short" };
  if (/skillbook/i.test(content)) return { passed: false, reason: "legacy" };
  if (!content.startsWith("---") || !content.includes("---", 4)) return { passed: false, reason: "no_frontmatter" };
  if (!/^#\s+.+/m.test(content)) return { passed: false, reason: "no_heading" };
  return { passed: true, reason: "ok" };
}

async function downloadSkillWithPlaywright(page: Page, slug: string): Promise<{ content: string; files: Map<string, string> } | null> {
  try {
    // Try to find the owner by going to search and finding the skill
    const searchUrl = `https://clawhub.ai/skills?q=${slug}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Find the skill link
    const html = await page.content();
    const ownerMatch = html.match(new RegExp(`href="\/([^\/]+)\/${slug}"`, "i"));
    
    if (!ownerMatch) {
      return null;
    }
    
    const owner = ownerMatch[1];
    const skillUrl = `https://clawhub.ai/${owner}/${slug}`;
    
    await page.goto(skillUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Try to find raw SKILL.md content - look for code blocks or file viewer
    const pageContent = await page.content();
    
    // Try to extract SKILL.md from various possible locations
    // Look for pre/code blocks that might contain the skill content
    const skillMdContent = await page.evaluate(() => {
      // Try multiple selectors
      const codeBlock = document.querySelector("pre code");
      if (codeBlock) return codeBlock.textContent || "";
      
      const pre = document.querySelector("pre");
      if (pre) return pre.textContent || "";
      
      // Look for markdown content in article or main
      const article = document.querySelector("article");
      if (article) return article.textContent || "";
      
      return "";
    });
    
    if (skillMdContent && skillMdContent.length > 100) {
      const files = new Map<string, string>();
      files.set("SKILL.md", skillMdContent);
      return { content: skillMdContent, files };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log("=== Playwright Skill Import ===\n");
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Get skillhub user
  const [user] = await db.select().from(users).where(eq(users.handle, "skillhub"));
  if (!user) {
    console.error("User 'skillhub' not found!");
    await browser.close();
    process.exit(1);
  }
  console.log(`User: ${user.handle}\n`);
  
  // Get already imported skills
  const existingSkills = await db.select({ slug: skills.slug }).from(skills)
    .where(eq(skills.ownerId, user.id));
  const existingSlugs = new Set(existingSkills.map(s => s.slug));
  console.log(`Already imported: ${existingSlugs.size} skills\n`);
  
  // Load all skills
  const allSkills = loadSkillsFromFile();
  const toImport = allSkills.filter(s => !existingSlugs.has(s.slug));
  console.log(`Skills to import: ${toImport.length}\n`);
  
  let imported = 0;
  let skipped = 0;
  const MAX = 100;
  
  for (let i = 0; i < Math.min(toImport.length, MAX); i++) {
    const skill = toImport[i];
    process.stdout.write(`[${i + 1}/${MAX}] ${skill.slug}... `);
    
    const result = await downloadSkillWithPlaywright(page, skill.slug);
    
    if (!result || !result.content) {
      console.log("SKIP (no content)");
      skipped++;
      continue;
    }
    
    const validation = validateSkillContent(result.content);
    if (!validation.passed) {
      console.log(`SKIP (${validation.reason})`);
      skipped++;
      continue;
    }
    
    try {
      const [newSkill] = await db.insert(skills).values({
        id: crypto.randomUUID(),
        name: skill.name,
        slug: skill.slug,
        description: result.content.substring(0, 200),
        ownerId: user.id,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      const [newVersion] = await db.insert(skillVersions).values({
        skillId: newSkill.id,
        version: "1.0.0",
        skillMd: result.content,
        changelog: "Imported from ClawHub",
        isLatest: true,
      }).returning();
      
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
      console.log(`ERROR: ${e.message?.substring(0, 40)}`);
    }
  }
  
  await browser.close();
  
  console.log(`\n=== Complete ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
}

main().catch(console.error);

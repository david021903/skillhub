import { chromium } from "playwright";
import * as fs from "fs";

interface SkillInfo {
  slug: string;
  name: string;
  owner: string;
}

async function extractSkills(html: string): Promise<SkillInfo[]> {
  const skills: SkillInfo[] = [];
  const skillPattern = /href="\/([^\/\?"]+)\/([^\/\?"]+)"/g;
  let match;
  
  while ((match = skillPattern.exec(html)) !== null) {
    const owner = match[1];
    const slug = match[2];
    if (owner && slug && 
        !["skills", "login", "register", "settings", "profile", "api", "docs", "about", "search"].includes(owner) &&
        !slug.includes(".") && 
        slug.length > 2 &&
        owner.length > 2) {
      skills.push({ owner, slug, name: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") });
    }
  }
  return skills;
}

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const allSkills = new Map<string, SkillInfo>();
  
  console.log("Starting to scrape skills from clawhub.ai with infinite scroll...\n");
  
  // Go to main skills page
  await page.goto("https://clawhub.ai/skills", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  
  let previousCount = 0;
  let noNewSkillsCount = 0;
  
  // Scroll and load more
  for (let i = 0; i < 100; i++) {
    const html = await page.content();
    const skills = await extractSkills(html);
    
    let newCount = 0;
    for (const skill of skills) {
      if (!allSkills.has(skill.slug)) {
        allSkills.set(skill.slug, skill);
        newCount++;
      }
    }
    
    console.log(`Scroll ${i + 1}: Found ${skills.length} links, ${newCount} new. Total: ${allSkills.size}`);
    
    if (allSkills.size === previousCount) {
      noNewSkillsCount++;
      if (noNewSkillsCount >= 5) {
        console.log("No new skills after 5 scrolls, stopping.");
        break;
      }
    } else {
      noNewSkillsCount = 0;
    }
    previousCount = allSkills.size;
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
  
  console.log(`\n=== Total unique skills found: ${allSkills.size} ===\n`);
  
  const sorted = Array.from(allSkills.values()).sort((a, b) => a.slug.localeCompare(b.slug));
  
  // Save as TypeScript array for import script
  const output = sorted.map(s => 
    `  { slug: "${s.slug}", name: "${s.name}", description: "" },`
  ).join("\n");
  
  fs.writeFileSync("scripts/all-skills.txt", output);
  console.log("Saved to scripts/all-skills.txt");
  
  console.log("\nAll skills found:");
  sorted.forEach(s => console.log(`  ${s.owner}/${s.slug}`));
}

main().catch(console.error);

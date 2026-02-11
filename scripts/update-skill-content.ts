import { db } from "../server/db.js";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

async function downloadAndExtractSkill(slug: string): Promise<string | null> {
  const tmpDir = `/tmp/skill-${slug}`;
  const zipPath = `${tmpDir}.zip`;
  
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(zipPath, { force: true });
    
    console.log(`  Downloading ${slug}...`);
    execSync(`curl -s "https://auth.clawdhub.com/api/v1/download?slug=${slug}" -o "${zipPath}"`, { timeout: 30000 });
    
    if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size < 100) {
      console.log(`  Download failed or empty`);
      return null;
    }
    
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync(`unzip -o "${zipPath}" -d "${tmpDir}"`, { timeout: 10000 });
    
    const skillMdPath = path.join(tmpDir, "SKILL.md");
    if (!fs.existsSync(skillMdPath)) {
      console.log(`  No SKILL.md found in ZIP`);
      return null;
    }
    
    const content = fs.readFileSync(skillMdPath, "utf-8");
    console.log(`  Got ${content.length} bytes of content`);
    
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(zipPath, { force: true });
    
    return content;
  } catch (error) {
    console.log(`  Error: ${error}`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(zipPath, { force: true });
    return null;
  }
}

async function updateSkillInDb(slug: string, newContent: string): Promise<boolean> {
  try {
    const skill = await db.query.skills.findFirst({
      where: eq(schema.skills.slug, slug),
    });
    
    if (!skill) {
      console.log(`  Skill not found in database: ${slug}`);
      return false;
    }
    
    const latestVersion = await db.query.skillVersions.findFirst({
      where: eq(schema.skillVersions.skillId, skill.id),
      orderBy: (versions, { desc }) => [desc(versions.createdAt)],
    });
    
    if (!latestVersion) {
      console.log(`  No version found for: ${slug}`);
      return false;
    }
    
    await db.update(schema.skillVersions)
      .set({ skillMd: newContent })
      .where(eq(schema.skillVersions.id, latestVersion.id));
    
    console.log(`  Updated in database!`);
    return true;
  } catch (error) {
    console.log(`  DB Error: ${error}`);
    return false;
  }
}

async function main() {
  console.log("=== Updating Skills with Real Content ===\n");
  
  const allSkills = await db.query.skills.findMany({
    with: {
      owner: true,
    }
  });
  
  const clawskillhubSkills = allSkills.filter(s => s.owner?.handle === "clawskillhub");
  console.log(`Found ${clawskillhubSkills.length} skills to update\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (const skill of clawskillhubSkills) {
    console.log(`[${updated + failed + 1}/${clawskillhubSkills.length}] ${skill.slug}`);
    
    const content = await downloadAndExtractSkill(skill.slug);
    if (content && content.length > 100) {
      const success = await updateSkillInDb(skill.slug, content);
      if (success) {
        updated++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`\n=== Complete ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  
  process.exit(0);
}

main().catch(console.error);

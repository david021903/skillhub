import * as https from "https";

interface SkillInfo {
  slug: string;
  name: string;
  description: string;
  owner: string;
}

async function fetchPage(page: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://clawhub.ai/skills?page=${page}`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function extractSkillsFromHtml(html: string): SkillInfo[] {
  const skills: SkillInfo[] = [];
  const regex = /https:\/\/clawhub\.ai\/([^\/]+)\/([^\s\)"\]]+)/g;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const owner = match[1];
    const slug = match[2].replace(/\\$/, "");
    if (owner !== "skills" && !owner.includes("?") && slug && !slug.includes("?")) {
      skills.push({
        slug,
        name: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        description: "",
        owner
      });
    }
  }
  
  return skills;
}

async function main() {
  const allSkills = new Map<string, SkillInfo>();
  
  console.log("Scraping all skills from source...\n");
  
  for (let page = 1; page <= 20; page++) {
    try {
      console.log(`Fetching page ${page}...`);
      const html = await fetchPage(page);
      const skills = extractSkillsFromHtml(html);
      
      if (skills.length === 0) {
        console.log(`Page ${page} returned no skills, stopping.`);
        break;
      }
      
      let newCount = 0;
      for (const skill of skills) {
        if (!allSkills.has(skill.slug)) {
          allSkills.set(skill.slug, skill);
          newCount++;
        }
      }
      
      console.log(`  Found ${skills.length} skills, ${newCount} new. Total unique: ${allSkills.size}`);
      
      if (newCount === 0) {
        console.log("No new skills found, stopping.");
        break;
      }
      
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`Error on page ${page}:`, e);
      break;
    }
  }
  
  console.log(`\n=== Total unique skills found: ${allSkills.size} ===\n`);
  
  const sorted = Array.from(allSkills.values()).sort((a, b) => a.slug.localeCompare(b.slug));
  
  console.log("// Paste this into import-validated.ts:\n");
  console.log("const ALL_SKILLS: SkillToImport[] = [");
  for (const skill of sorted) {
    console.log(`  { slug: "${skill.slug}", name: "${skill.name}", description: "${skill.description}" },`);
  }
  console.log("];");
}

main().catch(console.error);

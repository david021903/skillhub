import { db } from "../server/db.js";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { validateSkillMd } from "../server/validation.js";
import matter from "gray-matter";

async function main() {
  console.log("=== Re-validation of All Skills ===\n");

  const allValidations = await db
    .select({
      validationId: schema.skillValidations.id,
      versionId: schema.skillValidations.versionId,
      oldScore: schema.skillValidations.score,
      oldChecks: schema.skillValidations.checks,
      skillMd: schema.skillVersions.skillMd,
      skillName: schema.skills.name,
      skillSlug: schema.skills.slug,
    })
    .from(schema.skillValidations)
    .innerJoin(schema.skillVersions, eq(schema.skillValidations.versionId, schema.skillVersions.id))
    .innerJoin(schema.skills, eq(schema.skillVersions.skillId, schema.skills.id));

  console.log(`Found ${allValidations.length} validations to re-run\n`);

  let updated = 0;
  let unchanged = 0;
  let errors = 0;
  const scoreDist: Record<number, number> = {};

  for (let i = 0; i < allValidations.length; i++) {
    const v = allValidations[i];
    const label = `[${i + 1}/${allValidations.length}] ${v.skillSlug}`;

    if (!v.skillMd) {
      console.log(`${label} — SKIP: no SKILL.md content`);
      errors++;
      continue;
    }

    try {
      let manifest: Record<string, any> = {};
      try {
        const parsed = matter(v.skillMd);
        manifest = parsed.data || {};
      } catch {
        manifest = {};
      }

      const result = await validateSkillMd(v.skillMd, manifest);

      scoreDist[result.score] = (scoreDist[result.score] || 0) + 1;

      if (result.score !== v.oldScore) {
        await db
          .update(schema.skillValidations)
          .set({
            score: result.score,
            checks: result.checks,
            status: result.passed ? "passed" : "failed",
            finishedAt: new Date(),
          })
          .where(eq(schema.skillValidations.id, v.validationId));

        console.log(`${label} — ${v.oldScore} → ${result.score} (${result.checks.length} checks)`);
        updated++;
      } else {
        await db
          .update(schema.skillValidations)
          .set({
            checks: result.checks,
            status: result.passed ? "passed" : "failed",
            finishedAt: new Date(),
          })
          .where(eq(schema.skillValidations.id, v.validationId));

        unchanged++;
      }
    } catch (err) {
      console.log(`${label} — ERROR: ${err}`);
      errors++;
    }
  }

  console.log("\n=== Re-validation Complete ===");
  console.log(`Updated score: ${updated}`);
  console.log(`Score unchanged (checks updated): ${unchanged}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nNew score distribution:`);
  for (const [score, count] of Object.entries(scoreDist).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    console.log(`  ${score}%: ${count} skills`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

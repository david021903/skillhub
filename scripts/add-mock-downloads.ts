import { db } from "../server/db.js";
import { skills } from "../shared/models/skills.js";
import { eq, sql } from "drizzle-orm";

async function addMockDownloads() {
  console.log("Adding mock download counts to skills...");
  
  // Batch update using SQL with random values
  await db.execute(sql`
    UPDATE skills 
    SET 
      downloads = FLOOR(5 + RANDOM() * 46)::integer,
      weekly_downloads = FLOOR(2 + RANDOM() * 20)::integer
    WHERE downloads = 0 OR downloads IS NULL
  `);
  
  console.log("Updated skills with mock download counts");
  process.exit(0);
}

addMockDownloads().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

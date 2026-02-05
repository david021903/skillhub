import { db } from "../server/db.js";
import { users } from "../shared/models/auth.js";
import { eq } from "drizzle-orm";

async function fixSkillhubName() {
  console.log("Updating skillhub user name...");
  
  const result = await db.update(users)
    .set({ 
      firstName: "SkillHub", 
      lastName: "Official" 
    })
    .where(eq(users.handle, "skillhub"));
  
  console.log("Updated skillhub user to 'SkillHub Official'");
  process.exit(0);
}

fixSkillhubName().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

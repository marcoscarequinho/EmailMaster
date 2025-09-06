import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

async function resetAdminPassword() {
  try {
    console.log("Resetting admin password...");
    
    // Hash the password
    const password = "BB03@5bb03#5";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the 0admin user's password
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, "0admin"))
      .returning();
    
    if (result.length > 0) {
      console.log("✅ Admin password reset successfully!");
      console.log("Username: 0admin");
      console.log("Password: BB03@5bb03#5");
    } else {
      console.log("❌ User 0admin not found!");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error resetting password:", error);
    process.exit(1);
  }
}

resetAdminPassword();
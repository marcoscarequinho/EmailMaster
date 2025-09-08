import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

async function fixAllPasswords() {
  try {
    console.log("Checking all user passwords...\n");
    
    // Get all users
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      // Check if password looks like a bcrypt hash (starts with $2a$ or $2b$ and is 60 chars)
      const isBcryptHash = user.password.startsWith('$2') && user.password.length === 60;
      
      if (!isBcryptHash) {
        console.log(`❌ User "${user.username}" has unhashed password`);
        
        // For demonstration, we'll set a default password for non-admin users
        // In production, you'd want to force password reset
        let newPassword = user.password; // Keep existing if it's plain text
        
        // Special case for known test user
        if (user.username === "0admin") {
          newPassword = "BB03@5bb03#5";
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));
        
        console.log(`   ✅ Fixed: Password hashed for user "${user.username}"`);
        console.log(`   📝 Login: Username: ${user.username}, Password: ${newPassword}\n`);
      } else {
        console.log(`✅ User "${user.username}" already has hashed password`);
      }
    }
    
    console.log("\n✨ All passwords checked and fixed!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing passwords:", error);
    process.exit(1);
  }
}

import { eq } from "drizzle-orm";

fixAllPasswords();
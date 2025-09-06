import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function testLogin() {
  console.log("🔍 Testing login credentials...");

  try {
    // Test super admin
    console.log("\n👑 Testing Super Admin (1admin):");
    const superAdmin = await db.select().from(users).where(eq(users.username, "1admin")).limit(1);
    
    if (superAdmin.length > 0) {
      const user = superAdmin[0];
      console.log(`✅ User found: ${user.username} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      
      // Test password
      const passwordMatch = await bcrypt.compare("BB03@5bb03#5", user.password);
      console.log(`   Password match: ${passwordMatch}`);
      
      if (!passwordMatch) {
        console.log("🔄 Updating password...");
        const hashedPassword = await bcrypt.hash("BB03@5bb03#5", 10);
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));
        console.log("✅ Password updated!");
      }
    } else {
      console.log("❌ Super admin not found!");
    }

    // Test client
    console.log("\n👤 Testing Client (contato):");
    const client = await db.select().from(users).where(eq(users.username, "contato")).limit(1);
    
    if (client.length > 0) {
      const user = client[0];
      console.log(`✅ User found: ${user.username} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      
      // Test password
      const passwordMatch = await bcrypt.compare("031205", user.password);
      console.log(`   Password match: ${passwordMatch}`);
      
      if (!passwordMatch) {
        console.log("🔄 Updating password...");
        const hashedPassword = await bcrypt.hash("031205", 10);
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));
        console.log("✅ Password updated!");
      }
    } else {
      console.log("❌ Client not found!");
    }

    // Test with different username formats
    console.log("\n🔍 Testing different login formats:");
    
    // Test by email
    const adminByEmail = await db.select().from(users).where(eq(users.email, "admin@marcoscarequinho.com.br")).limit(1);
    console.log(`Email login (admin@marcoscarequinho.com.br): ${adminByEmail.length > 0 ? '✅ Found' : '❌ Not found'}`);
    
    const clientByEmail = await db.select().from(users).where(eq(users.email, "contato@marcoscarequinho.com.br")).limit(1);
    console.log(`Email login (contato@marcoscarequinho.com.br): ${clientByEmail.length > 0 ? '✅ Found' : '❌ Not found'}`);

    console.log("\n✅ Login test completed!");
    
  } catch (error) {
    console.error("❌ Error during login test:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

testLogin();
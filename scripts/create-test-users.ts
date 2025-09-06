import { db } from "../server/db";
import { users } from "../shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

async function createTestUsers() {
  try {
    console.log("Creating test users for email testing...\n");
    
    // Create user1
    const user1Email = "user1@mygmail.com.br";
    const existingUser1 = await db.select().from(users).where(eq(users.email, user1Email));
    
    if (existingUser1.length === 0) {
      const hashedPassword = await bcrypt.hash("senha123", 10);
      await db.insert(users).values({
        id: randomUUID(),
        username: "user1",
        email: user1Email,
        password: hashedPassword,
        firstName: "Usuário",
        lastName: "Um",
        role: "client",
        isActive: true,
        domainId: null,
      });
      console.log("✅ Created user1@mygmail.com.br (password: senha123)");
    } else {
      console.log("ℹ️  user1@mygmail.com.br already exists");
    }
    
    // Create user2
    const user2Email = "user2@mygmail.com.br";
    const existingUser2 = await db.select().from(users).where(eq(users.email, user2Email));
    
    if (existingUser2.length === 0) {
      const hashedPassword = await bcrypt.hash("senha123", 10);
      await db.insert(users).values({
        id: randomUUID(),
        username: "user2",
        email: user2Email,
        password: hashedPassword,
        firstName: "Usuário",
        lastName: "Dois",
        role: "client",
        isActive: true,
        domainId: null,
      });
      console.log("✅ Created user2@mygmail.com.br (password: senha123)");
    } else {
      console.log("ℹ️  user2@mygmail.com.br already exists");
    }
    
    console.log("\n📧 Test users ready!");
    console.log("Now you can:");
    console.log("1. Login as user1@mygmail.com.br");
    console.log("2. Send email to user2@mygmail.com.br");
    console.log("3. Login as user2@mygmail.com.br to check inbox");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating test users:", error);
    process.exit(1);
  }
}

import { eq } from "drizzle-orm";

createTestUsers();
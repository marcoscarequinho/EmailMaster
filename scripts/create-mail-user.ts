import { db } from "../server/db";
import { users, domains } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function createMailUser() {
  console.log("🔧 Creating user contato@mail.marcoscarequinho.com.br...");

  try {
    // First, find the domain marcoscarequinho.com.br
    const domain = await db
      .select()
      .from(domains)
      .where(eq(domains.domain, "marcoscarequinho.com.br"))
      .limit(1);

    if (domain.length === 0) {
      console.error("❌ Domain marcoscarequinho.com.br not found!");
      process.exit(1);
    }

    const domainId = domain[0].id;
    console.log(`✅ Found domain: ${domain[0].domain} (ID: ${domainId})`);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "contato@mail.marcoscarequinho.com.br"))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("⚠️  User already exists, updating password...");
      
      const hashedPassword = await bcrypt.hash("031205", 10);
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          username: "contato",
          firstName: "Contato",
          lastName: "Mail",
          isActive: true
        })
        .where(eq(users.id, existingUser[0].id));
      
      console.log("✅ User updated successfully!");
    } else {
      console.log("➕ Creating new user...");
      
      const hashedPassword = await bcrypt.hash("031205", 10);
      
      const newUser = await db
        .insert(users)
        .values({
          username: "contato",
          password: hashedPassword,
          email: "contato@mail.marcoscarequinho.com.br",
          firstName: "Contato",
          lastName: "Mail",
          domainId: domainId,
          role: "client",
          isActive: true,
        })
        .returning();

      console.log("✅ User created successfully!");
      console.log(`   Username: contato`);
      console.log(`   Email: contato@mail.marcoscarequinho.com.br`);
      console.log(`   Password: 031205`);
      console.log(`   Role: client`);
    }

    // Verify the user exists
    const verifyUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "contato@mail.marcoscarequinho.com.br"))
      .limit(1);

    if (verifyUser.length > 0) {
      console.log("\n✅ Verification successful:");
      console.log(`   ID: ${verifyUser[0].id}`);
      console.log(`   Username: ${verifyUser[0].username}`);
      console.log(`   Email: ${verifyUser[0].email}`);
      console.log(`   Active: ${verifyUser[0].isActive}`);
      console.log(`   Role: ${verifyUser[0].role}`);
    }

  } catch (error) {
    console.error("❌ Error creating user:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

createMailUser();
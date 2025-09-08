import { db } from "../server/db";
import { users, domains } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

async function checkAndCreateUsers() {
  console.log("🔍 Checking existing users...");

  try {
    // Check existing users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users in database:`);
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Role: ${user.role}`);
    });

    // Check if domain exists
    let domain = await db.select().from(domains).where(eq(domains.domain, "mail.marcoscarequinho.com.br")).limit(1);
    
    if (domain.length === 0) {
      console.log("📧 Creating domain mail.marcoscarequinho.com.br...");
      const [newDomain] = await db
        .insert(domains)
        .values({
          id: randomUUID(),
          domain: "mail.marcoscarequinho.com.br",
          description: "Email server domain",
          isActive: true,
          createdBy: "system",
        })
        .returning();
      domain = [newDomain];
      console.log("✅ Domain created:", newDomain.domain);
    } else {
      console.log("✅ Domain already exists:", domain[0].domain);
    }

    // Check super admin
    const superAdmin = await db.select().from(users).where(eq(users.username, "1admin")).limit(1);
    
    if (superAdmin.length === 0) {
      console.log("👑 Creating super admin user...");
      const hashedPassword = await bcrypt.hash("BB03@5bb03#5", 10);
      
      const [newSuperAdmin] = await db
        .insert(users)
        .values({
          id: randomUUID(),
          username: "1admin",
          password: hashedPassword,
          email: "admin@mail.marcoscarequinho.com.br",
          firstName: "Super",
          lastName: "Admin",
          domainId: domain[0].id,
          role: "super_admin",
          isActive: true,
        })
        .returning();
      
      console.log("✅ Super admin created:", { 
        username: newSuperAdmin.username, 
        email: newSuperAdmin.email,
        role: newSuperAdmin.role 
      });
    } else {
      console.log("✅ Super admin already exists:", superAdmin[0].username);
      
      // Update password if needed
      console.log("🔄 Updating super admin password...");
      const hashedPassword = await bcrypt.hash("BB03@5bb03#5", 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, superAdmin[0].id));
      console.log("✅ Password updated for super admin");
    }

    // Check client user
    const client = await db.select().from(users).where(eq(users.username, "contato")).limit(1);
    
    if (client.length === 0) {
      console.log("👤 Creating client user...");
      const hashedPassword = await bcrypt.hash("031205", 10);
      
      const [newClient] = await db
        .insert(users)
        .values({
          id: randomUUID(),
          username: "contato",
          password: hashedPassword,
          email: "contato@mail.marcoscarequinho.com.br",
          firstName: "Contato",
          lastName: "Cliente",
          domainId: domain[0].id,
          role: "client",
          isActive: true,
        })
        .returning();
      
      console.log("✅ Client user created:", { 
        username: newClient.username, 
        email: newClient.email,
        role: newClient.role 
      });
    } else {
      console.log("✅ Client user already exists:", client[0].username);
      
      // Update password if needed
      console.log("🔄 Updating client password...");
      const hashedPassword = await bcrypt.hash("031205", 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, client[0].id));
      console.log("✅ Password updated for client");
    }

    // Final verification
    console.log("\n🔍 Final user verification:");
    const finalUsers = await db.select().from(users);
    finalUsers.forEach(user => {
      console.log(`✅ ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });

    console.log("\n✅ Setup completed successfully!");
    console.log("\n📋 Login Information:");
    console.log("Super Admin - Username: 1admin, Password: BB03@5bb03#5");
    console.log("Client - Username: contato, Password: 031205");
    
  } catch (error) {
    console.error("❌ Error during setup:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkAndCreateUsers();
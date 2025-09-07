import { db } from "../server/db";
import { users, domains } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function fixDomain() {
  console.log("🔧 Corrigindo domínio para mail.marcoscarequinho.com.br...");

  try {
    // Verificar domínio atual
    const currentDomain = await db.select().from(domains).where(eq(domains.domain, "marcoscarequinho.com.br")).limit(1);
    console.log("📋 Domínio atual:", currentDomain.length > 0 ? currentDomain[0].domain : "Não encontrado");

    // Verificar se já existe o domínio correto
    let correctDomain = await db.select().from(domains).where(eq(domains.domain, "mail.marcoscarequinho.com.br")).limit(1);
    
    if (correctDomain.length === 0) {
      console.log("✨ Criando domínio correto: mail.marcoscarequinho.com.br");
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
      correctDomain = [newDomain];
      console.log("✅ Domínio criado:", newDomain.domain);
    } else {
      console.log("✅ Domínio correto já existe:", correctDomain[0].domain);
    }

    // Atualizar usuários para usar o domínio correto
    console.log("\n👥 Atualizando usuários...");
    
    // Super Admin
    const superAdmin = await db.select().from(users).where(eq(users.username, "1admin")).limit(1);
    if (superAdmin.length > 0) {
      await db
        .update(users)
        .set({ 
          domainId: correctDomain[0].id,
          email: "admin@mail.marcoscarequinho.com.br"
        })
        .where(eq(users.id, superAdmin[0].id));
      console.log("✅ Super Admin atualizado: admin@mail.marcoscarequinho.com.br");
    }

    // Client
    const client = await db.select().from(users).where(eq(users.username, "contato")).limit(1);
    if (client.length > 0) {
      await db
        .update(users)
        .set({ 
          domainId: correctDomain[0].id,
          // Email já está correto: contato@mail.marcoscarequinho.com.br
        })
        .where(eq(users.id, client[0].id));
      console.log("✅ Cliente atualizado com domínio correto");
    }

    // Remover domínio incorreto se não houver mais usuários usando
    if (currentDomain.length > 0) {
      const usersWithOldDomain = await db.select().from(users).where(eq(users.domainId, currentDomain[0].id));
      if (usersWithOldDomain.length === 0) {
        await db.delete(domains).where(eq(domains.id, currentDomain[0].id));
        console.log("🗑️  Domínio antigo removido: marcoscarequinho.com.br");
      }
    }

    // Verificação final
    console.log("\n🔍 Verificação final:");
    const allUsers = await db.select().from(users);
    const allDomains = await db.select().from(domains);
    
    console.log("📧 Domínios:");
    allDomains.forEach(domain => {
      console.log(`  - ${domain.domain} (${domain.isActive ? 'Ativo' : 'Inativo'})`);
    });

    console.log("\n👥 Usuários:");
    for (const user of allUsers) {
      const userDomain = allDomains.find(d => d.id === user.domainId);
      console.log(`  - ${user.username} (${user.email}) - Domínio: ${userDomain?.domain || 'N/A'}`);
    }

    console.log("\n✅ Correção do domínio concluída!");
    console.log("\n📋 Informações de Login Atualizadas:");
    console.log("Super Admin - Username: 1admin, Email: admin@mail.marcoscarequinho.com.br, Password: BB03@5bb03#5");
    console.log("Client - Username: contato, Email: contato@mail.marcoscarequinho.com.br, Password: 031205");
    
  } catch (error) {
    console.error("❌ Erro durante a correção:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

fixDomain();
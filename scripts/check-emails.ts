import { db } from "../server/db";
import { users, emails } from "../shared/schema";
import dotenv from "dotenv";

dotenv.config();

async function checkEmails() {
  try {
    console.log("=== Checking Users ===\n");
    
    // Get all users
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      console.log(`User: ${user.username} (${user.email})`);
      console.log(`  Role: ${user.role}`);
      
      // Get emails for this user
      const userEmails = await db.select().from(emails).where(eq(emails.userId, user.id));
      
      const inbox = userEmails.filter(e => e.folder === 'inbox');
      const sent = userEmails.filter(e => e.folder === 'sent');
      
      console.log(`  Emails: ${inbox.length} in inbox, ${sent.length} in sent`);
      
      if (inbox.length > 0) {
        console.log("  Recent inbox emails:");
        inbox.slice(0, 3).forEach(email => {
          console.log(`    - From: ${email.sender}, Subject: ${email.subject}`);
        });
      }
      
      if (sent.length > 0) {
        console.log("  Recent sent emails:");
        sent.slice(0, 3).forEach(email => {
          console.log(`    - To: ${email.recipient}, Subject: ${email.subject}`);
        });
      }
      
      console.log();
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error checking emails:", error);
    process.exit(1);
  }
}

import { eq } from "drizzle-orm";

checkEmails();
import 'dotenv/config';
import { db, pool } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function updatePassword() {
  try {
    const username = '1admin';
    const newPassword = '031205';

    console.log(`🔄 Updating password for user: ${username}`);

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password in the database
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, username));

    console.log(`✅ Password updated successfully for ${username}`);
    console.log(`New password: ${newPassword}`);
  } catch (error: any) {
    console.error('❌ Error updating password:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updatePassword();

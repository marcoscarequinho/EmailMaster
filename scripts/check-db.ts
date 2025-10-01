import 'dotenv/config';
import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...');

    // Check for duplicate usernames
    const duplicates = await db.execute(sql`
      SELECT username, COUNT(*) as count
      FROM users
      GROUP BY username
      HAVING COUNT(*) > 1
    `);

    if (duplicates.rows.length > 0) {
      console.log('❌ Found duplicate usernames:');
      console.log(duplicates.rows);
      console.log('\n⚠️  Please fix duplicates before running db:push');
      process.exit(1);
    }

    // Check all users
    const allUsers = await db.select().from(users);
    console.log(`✅ Found ${allUsers.length} users in database`);
    console.log(allUsers.map(u => ({ username: u.username, email: u.email, role: u.role })));

    console.log('\n✅ Database check passed! Safe to run db:push');
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkDatabase();

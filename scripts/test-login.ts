import 'dotenv/config';
import { db, pool } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function testLogin() {
  try {
    const username = '1admin';
    const password = '031205';

    console.log(`🔍 Testing login for: ${username}`);

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`✅ User found: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);

    // Test password
    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
      console.log(`✅ Password is correct!`);
    } else {
      console.log(`❌ Password is incorrect`);

      // Try to create a new hash and compare
      const newHash = await bcrypt.hash(password, 10);
      console.log(`\nNew hash would be: ${newHash.substring(0, 20)}...`);

      const testCompare = await bcrypt.compare(password, newHash);
      console.log(`Test with new hash: ${testCompare ? '✅ PASS' : '❌ FAIL'}`);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testLogin();

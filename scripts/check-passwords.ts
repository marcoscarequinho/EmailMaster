import 'dotenv/config';
import { db } from '../server/db.js';
import { users } from '../shared/schema.js';

async function checkPasswords() {
  try {
    const allUsers = await db.select({
      username: users.username,
      password: users.password,
      role: users.role
    }).from(users);

    console.log('Users in database:');
    allUsers.forEach(user => {
      console.log(`\nUsername: ${user.username}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password format: ${user.password.substring(0, 20)}...`);
      console.log(`Password length: ${user.password.length}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkPasswords();

import { pool } from '../server/db';

async function removeUsernameUniqueConstraint() {
  console.log('🔧 Removing UNIQUE constraint from username column...');
  
  try {
    // Drop the unique constraint on username
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_unique;');
    console.log('✅ Removed UNIQUE constraint from username column');
    
    console.log('✅ Migration completed - users can now have duplicate usernames across domains');
  } catch (error) {
    console.error('❌ Error removing constraint:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

removeUsernameUniqueConstraint().catch(console.error);
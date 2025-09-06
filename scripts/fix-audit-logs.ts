import { pool } from '../server/db';

async function fixAuditLogsConstraint() {
  console.log('🔧 Fixing audit_logs table constraints...');
  
  try {
    // Make user_id column nullable
    await pool.query('ALTER TABLE audit_logs ALTER COLUMN user_id DROP NOT NULL;');
    console.log('✅ Successfully made user_id nullable in audit_logs table');
    
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixAuditLogsConstraint().catch(console.error);
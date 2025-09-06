import { pool } from '../server/db';

async function fixForeignKeys() {
  console.log('🔧 Removing problematic foreign key constraints...');
  
  try {
    // Drop foreign key constraints that prevent user deletion
    await pool.query('ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_users_id_fk;');
    console.log('✅ Dropped audit_logs_user_id_users_id_fk constraint');
    
    await pool.query('ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_target_user_id_users_id_fk;');
    console.log('✅ Dropped audit_logs_target_user_id_users_id_fk constraint');
    
    console.log('✅ Foreign key constraints removed successfully');
    console.log('ℹ️  Audit logs will be preserved but won\'t enforce referential integrity');
    
  } catch (error) {
    console.error('❌ Error removing foreign key constraints:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixForeignKeys().catch(console.error);
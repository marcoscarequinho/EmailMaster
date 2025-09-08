import { pool } from '../server/db';

async function checkConstraints() {
  console.log('🔍 Checking database constraints...');
  
  try {
    // Check audit_logs table structure
    const tableInfo = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs'
      ORDER BY column_name;
    `);
    
    console.log('📋 audit_logs table structure:');
    console.table(tableInfo.rows);
    
    // Check foreign key constraints
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'audit_logs';
    `);
    
    console.log('🔗 audit_logs foreign key constraints:');
    console.table(constraints.rows);
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkConstraints().catch(console.error);
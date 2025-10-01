import 'dotenv/config';
import { db, pool } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function applySchema() {
  try {
    console.log('🔄 Applying schema changes...');

    // Add unique constraint to username if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'users_username_unique'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
          RAISE NOTICE 'Added users_username_unique constraint';
        ELSE
          RAISE NOTICE 'Constraint users_username_unique already exists';
        END IF;
      END $$;
    `);

    console.log('✅ Schema applied successfully!');
  } catch (error: any) {
    console.error('❌ Error applying schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applySchema();

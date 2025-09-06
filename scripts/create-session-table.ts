import { pool } from '../server/db';
import dotenv from 'dotenv';

dotenv.config();

async function createSessionTable() {
  try {
    // Create session table for express-session
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      ) WITH (OIDS=FALSE);
    `);
    
    console.log('Session table created successfully');
    
    // Create index if it doesn't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
    
    console.log('Session expire index created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating session table:', error);
    process.exit(1);
  }
}

createSessionTable();
import { db } from '../server/db';
import { users } from '../shared/schema';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function initDatabase() {
  try {
    // Check if users exist
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('No users found. Creating super admin...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('BB03@5bb03#5', 10);
      
      // Create super admin user
      await db.insert(users).values({
        username: '0admin',
        password: hashedPassword,
        role: 'super_admin',
        email: '0admin@system.local',
        isActive: true
      });
      
      console.log('Super admin created successfully!');
      console.log('Username: 0admin');
      console.log('Password: BB03@5bb03#5');
    } else {
      console.log('Users already exist in database.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
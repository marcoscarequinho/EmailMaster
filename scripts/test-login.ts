import { db } from '../server/db';
import { users } from '../shared/schema';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

async function testLogin() {
  try {
    // Get the user
    const [user] = await db.select().from(users).where(eq(users.username, '0admin'));
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive
    });
    
    // Test password
    const testPassword = 'BB03@5bb03#5';
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log('Password test:', isValid ? 'PASS' : 'FAIL');
    console.log('Password hash stored:', user.password.substring(0, 20) + '...');
    
    // If failed, let's create a new hash
    if (!isValid) {
      console.log('\nCreating new hash for password...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('New hash:', newHash);
      
      // Update the user with new hash
      await db.update(users)
        .set({ password: newHash })
        .where(eq(users.username, '0admin'));
      
      console.log('Password updated successfully!');
      
      // Test again
      const isValidNow = await bcrypt.compare(testPassword, newHash);
      console.log('New password test:', isValidNow ? 'PASS' : 'FAIL');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing login:', error);
    process.exit(1);
  }
}

testLogin();
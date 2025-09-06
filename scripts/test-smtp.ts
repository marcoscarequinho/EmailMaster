import { emailService } from '../server/emailService';

async function testSMTP() {
  console.log('🔧 Testing SMTP configuration...');
  
  // Get current status
  const status = emailService.getStatus();
  console.log('📊 SMTP Status:', status);
  
  // Test connection
  const isConnected = await emailService.testConnection();
  
  if (isConnected) {
    console.log('✅ SMTP connection successful!');
  } else {
    console.log('❌ SMTP connection failed!');
  }
  
  return isConnected;
}

testSMTP().catch(console.error);
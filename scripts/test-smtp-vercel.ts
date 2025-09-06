import nodemailer from 'nodemailer';

const testConfigurations = [
  {
    name: 'Port 587 STARTTLS with Auth',
    host: 'mail.marcoscarequinho.com.br',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: 'contato@mail.marcoscarequinho.com.br',
      pass: '031205'
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    }
  },
  {
    name: 'Port 465 SSL with Auth',
    host: 'mail.marcoscarequinho.com.br',
    port: 465,
    secure: true,
    auth: {
      user: 'contato@mail.marcoscarequinho.com.br',
      pass: '031205'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  {
    name: 'Port 2525 Alternative (MailGun style)',
    host: 'mail.marcoscarequinho.com.br',
    port: 2525,
    secure: false,
    auth: {
      user: 'contato@mail.marcoscarequinho.com.br',
      pass: '031205'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  {
    name: 'Port 587 without TLS',
    host: 'mail.marcoscarequinho.com.br',
    port: 587,
    secure: false,
    ignoreTLS: true,
    auth: {
      user: 'contato@mail.marcoscarequinho.com.br',
      pass: '031205'
    }
  }
];

async function testSMTPConfiguration(config: any) {
  console.log(`\n🔧 Testing ${config.name}...`);
  console.log(`   Host: ${config.host}:${config.port} (secure: ${config.secure})`);
  
  try {
    const transporter = nodemailer.createTransport({
      ...config,
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
      debug: false,
      logger: false
    });
    
    // Test connection
    const result = await transporter.verify();
    console.log(`✅ ${config.name} - Connection successful!`);
    return { success: true, config, result };
  } catch (error) {
    console.log(`❌ ${config.name} - Failed:`, error.message);
    return { success: false, error: error.message, config };
  }
}

async function testSendEmail(config: any) {
  console.log(`\n📧 Testing email sending with ${config.name}...`);
  
  try {
    const transporter = nodemailer.createTransport({
      ...config,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
    
    const testEmail = {
      from: 'contato@mail.marcoscarequinho.com.br',
      to: 'contato@mail.marcoscarequinho.com.br', // Send to self for testing
      subject: 'SMTP Test from EmailMaster',
      text: 'This is a test email from EmailMaster application.',
      html: '<p>This is a <b>test email</b> from EmailMaster application.</p>'
    };
    
    const info = await transporter.sendMail(testEmail);
    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.log(`❌ Email sending failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Testing SMTP configurations for Vercel deployment\n');
  console.log('Host: mail.marcoscarequinho.com.br');
  console.log('User: contato@mail.marcoscarequinho.com.br');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const config of testConfigurations) {
    const result = await testSMTPConfiguration(config);
    results.push(result);
    
    // If connection successful, try sending a test email
    if (result.success) {
      await testSendEmail(config);
      break; // Stop after first successful config
    }
    
    // Wait 2 seconds between attempts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 Summary:');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful configurations: ${successful.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.config.name}`);
  });
  
  console.log(`❌ Failed configurations: ${failed.length}`);
  failed.forEach(r => {
    console.log(`   - ${r.config.name}: ${r.error}`);
  });
  
  if (successful.length > 0) {
    console.log('\n🎯 Recommended .env configuration:');
    console.log('=' .repeat(40));
    const best = successful[0];
    console.log(`SMTP_HOST=${best.config.host}`);
    console.log(`SMTP_PORT=${best.config.port}`);
    console.log(`SMTP_SECURE=${best.config.secure}`);
    console.log(`SMTP_USER=${best.config.auth.user}`);
    console.log(`SMTP_PASS=${best.config.auth.pass}`);
    
    if (best.config.requireTLS) {
      console.log('# Add to emailService.ts: requireTLS: true');
    }
    if (best.config.ignoreTLS) {
      console.log('# Add to emailService.ts: ignoreTLS: true');
    }
  } else {
    console.log('\n❌ No working SMTP configuration found.');
    console.log('Possible issues:');
    console.log('- SMTP server is not accessible from this network');
    console.log('- Firewall blocking SMTP ports');
    console.log('- Incorrect credentials');
    console.log('- Server requires different authentication method');
  }
}

main().catch(console.error);
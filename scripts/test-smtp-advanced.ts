import nodemailer from 'nodemailer';

const testConfigurations = [
  {
    name: 'Port 587 STARTTLS',
    host: 'mail.marcoscarequinho.com.br',
    port: 587,
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
    name: 'Port 465 SSL',
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
    name: 'Port 25 Plain',
    host: 'mail.marcoscarequinho.com.br',
    port: 25,
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
    name: 'Port 2525 Alternative',
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
  }
];

async function testSMTPConfiguration(config: any) {
  console.log(`\n🔧 Testing ${config.name}...`);
  console.log(`   Host: ${config.host}:${config.port} (secure: ${config.secure})`);
  
  try {
    const transporter = nodemailer.createTransport(config);
    
    // Test connection
    await transporter.verify();
    console.log(`✅ ${config.name} - Connection successful!`);
    return { success: true, config };
  } catch (error) {
    console.log(`❌ ${config.name} - Failed:`, error.message);
    return { success: false, error: error.message, config };
  }
}

async function testAllConfigurations() {
  console.log('🚀 Testing SMTP configurations for mail.marcoscarequinho.com.br\n');
  
  const results = [];
  
  for (const config of testConfigurations) {
    const result = await testSMTPConfiguration(config);
    results.push(result);
  }
  
  console.log('\n📊 Summary:');
  console.log('=' .repeat(50));
  
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
    console.log('\n🎯 Recommended configuration:');
    const best = successful[0];
    console.log(`SMTP_HOST=${best.config.host}`);
    console.log(`SMTP_PORT=${best.config.port}`);
    console.log(`SMTP_SECURE=${best.config.secure}`);
    console.log(`SMTP_USER=${best.config.auth.user}`);
    console.log(`SMTP_PASS=${best.config.auth.pass}`);
  }
}

testAllConfigurations().catch(console.error);
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('📧 Gmail SMTP Setup for EmailMaster');
console.log('=' .repeat(50));

const instructions = `
Para configurar Gmail SMTP:

1. Acesse sua conta Google: https://accounts.google.com
2. Vá em "Segurança" → "Verificação em duas etapas"
3. Ative a verificação em duas etapas se não estiver ativa
4. Vá em "Senhas de app" → "Gerar senha de app"
5. Selecione "Email" e "Outro (nome personalizado)"
6. Digite "EmailMaster" e clique em "Gerar"
7. Copie a senha gerada (16 caracteres)

Configuração para .env:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-de-app-de-16-caracteres

Alternativas para produção (Vercel):
- SendGrid: https://sendgrid.com (100 emails/dia grátis)
- Mailgun: https://mailgun.com (100 emails/dia grátis)  
- Resend: https://resend.com (100 emails/dia grátis)
`;

console.log(instructions);

// Create a sample .env with Gmail configuration
const sampleEnv = `DATABASE_URL=postgresql://neondb_owner:npg_QEK7PUm0bCWh@ep-lucky-hall-adgugw4x-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SESSION_SECRET=your-secret-key-here-change-in-production
NODE_ENV=development

# SMTP Configuration - Gmail (recommended for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-aqui

# Original domain configuration (backup)
# SMTP_HOST=mail.marcoscarequinho.com.br
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=contato@mail.marcoscarequinho.com.br
# SMTP_PASS=031205`;

try {
  writeFileSync('.env.gmail-example', sampleEnv);
  console.log('\n✅ Arquivo .env.gmail-example criado!');
  console.log('   Copie e cole no seu .env após configurar o Gmail');
} catch (error) {
  console.error('❌ Erro ao criar arquivo:', error);
}
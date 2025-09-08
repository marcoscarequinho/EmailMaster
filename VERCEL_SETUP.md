# 🚀 Configuração para Deploy no Vercel

## 📋 Checklist de Compatibilidade ✅

### ✅ **Arquivos Configurados:**
- `vercel.json` - Configuração de deployment
- `api/index.ts` - Função serverless principal
- `package.json` - Scripts de build otimizados
- Dependências CORS adicionadas

### 🔧 **Variáveis de Ambiente no Vercel:**

Configure essas variáveis no painel do Vercel:

```bash
# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_QEK7PUm0bCWh@ep-lucky-hall-adgugw4x-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Session Configuration
SESSION_SECRET=sua-chave-secreta-super-forte-para-producao

# Environment
NODE_ENV=production

# SMTP Configuration
SMTP_HOST=smtp.mailmarcoscarequinho.com.br
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contato@mail.marcoscarequinho.com.br
SMTP_PASS=sua 031205
```

### 🏗️ **Estrutura de Build:**
- **Frontend**: Vite build → `dist/public/`
- **API**: Serverless function em `api/index.ts`
- **Database**: Neon PostgreSQL (já configurado)

### 📦 **Comandos de Deploy:**
```bash
# Instalar Vercel CLI (se necessário)
npm i -g vercel

# Deploy
vercel

# Deploy com produção
vercel --prod
```

### 🔒 **Segurança:**
- Sessions configuradas com PostgreSQL
- CORS habilitado para Vercel
- Headers de segurança configurados
- Rate limiting por função serverless

### 📊 **Monitoramento:**
- Health check: `/api/health`
- Logs no Vercel Dashboard
- Timeout de 30 segundos por função

## 🎯 **Usuários Pré-configurados:**
- **Super Admin**: `1admin` / `BB03@5bb03#5`
- **Cliente Email**: `contato@mail.marcoscarequinho.com.br` / `031205`

## ✅ **Status: PRONTO PARA DEPLOY!**
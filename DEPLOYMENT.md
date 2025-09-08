# Deployment Guide - EmailMaster

Este projeto é uma aplicação full-stack (React + Node.js + PostgreSQL) que requer servidor Node.js para funcionar completamente.

## ✅ Plataformas Recomendadas

### 1. **Railway** (Recomendado)
- ✅ Suporte completo a Node.js
- ✅ PostgreSQL incluído
- ✅ Deploy automático via GitHub
- 💰 $5/mês com PostgreSQL

**Steps:**
1. Conecte seu repositório GitHub
2. Adicione variáveis de ambiente
3. Deploy automático

### 2. **Render**
- ✅ Suporte a Node.js 
- ✅ PostgreSQL gratuito
- ✅ SSL automático
- 💰 Gratuito com limitações

### 3. **Heroku**
- ✅ Suporte completo
- 💰 Pago desde 2022

### 4. **DigitalOcean App Platform**
- ✅ Suporte completo
- 💰 ~$12/mês

## ⚠️ Vercel Limitações

A Vercel é otimizada para:
- Aplicações frontend (React, Next.js)
- Serverless functions simples

**Para este projeto na Vercel:**
- ✅ Frontend funciona
- ❌ Backend não funciona (Express + sessões + PostgreSQL)

## 🚀 Deploy no Railway

1. Acesse [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Selecione: `marcoscarequinho/EmailMaster`
4. Adicione variáveis de ambiente:
   ```
   DATABASE_URL=sua-url-postgresql
   SESSION_SECRET=sua-chave-secreta
   NODE_ENV=production
   SMTP_HOST=mail.marcoscarequinho.com.br
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=contato@mail.marcoscarequinho.com.br
   SMTP_PASS=sua-senha
   ```
5. Deploy automático!

## 📧 Configuração SMTP

Para SMTP funcionar em produção, use:
- Gmail SMTP (desenvolvimento)
- SendGrid (produção) - 100 emails/dia grátis
- Mailgun (produção) - 100 emails/dia grátis

Execute: `npx tsx scripts/setup-gmail-smtp.ts` para instruções.

## 🏠 Desenvolvimento Local

```bash
npm run dev  # http://localhost:5000
```
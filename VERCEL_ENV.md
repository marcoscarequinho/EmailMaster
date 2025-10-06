# Variáveis de Ambiente para Vercel

Configure estas variáveis de ambiente no painel da Vercel:

## Obrigatórias

### DATABASE_URL
```
postgresql://neondb_owner:npg_QEK7PUm0bCWh@ep-lucky-hall-adgugw4x-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```
**Descrição:** String de conexão com o banco de dados PostgreSQL (Neon)

### NODE_ENV
```
production
```
**Descrição:** Ambiente de execução da aplicação

### SESSION_SECRET
```
[gerar uma string aleatória segura]
```
**Descrição:** Chave secreta para criptografar sessões de usuário

---

## Como configurar na Vercel:

1. Acesse o projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável acima
4. Selecione os ambientes: **Production**, **Preview**, e **Development**
5. Clique em **Save**

---

## Gerando SESSION_SECRET:

Use este comando para gerar uma chave segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use este valor temporário (MUDE em produção):
```
a7f8e9d6c5b4a3210fedcba9876543210abcdef1234567890abcdef123456789
```

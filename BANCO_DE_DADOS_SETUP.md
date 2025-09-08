# Configuração do Banco de Dados PostgreSQL

Para que o EmailMaster funcione completamente, você precisa configurar um banco de dados PostgreSQL. Aqui estão as opções:

## Opção 1: PostgreSQL Local (Windows)
1. Baixe e instale o PostgreSQL: https://www.postgresql.org/download/windows/
2. Durante a instalação, defina uma senha para o usuário `postgres`
3. Após a instalação, crie um banco chamado `emailmaster`:
   ```sql
   CREATE DATABASE emailmaster;
   ```
4. Atualize o arquivo `.env`:
   ```
   DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/emailmaster?sslmode=disable
   ```

## Opção 2: Neon (PostgreSQL na nuvem - RECOMENDADO)
1. Vá para https://neon.tech/ e crie uma conta gratuita
2. Crie um novo projeto
3. Copie a connection string fornecida
4. Atualize o arquivo `.env`:
   ```
   DATABASE_URL=sua_connection_string_do_neon
   ```

## Opção 3: Supabase (PostgreSQL na nuvem)
1. Vá para https://supabase.com/ e crie uma conta
2. Crie um novo projeto
3. Na seção "Settings > Database", copie a connection string
4. Atualize o arquivo `.env`

## Após configurar o banco:
1. Execute: `npm run db:push` para criar as tabelas
2. Execute: `npx tsx setup-users.js` para criar os usuários iniciais
3. Execute: `npm run dev` para iniciar o servidor

## Usuários que serão criados:
- **Super Admin**: usuário `1admin`, senha `BB03@5bb03#5`
- **Cliente Email**: email `contato@mail.marcoscarequinho.com.br`, senha `031205`

## Configurações de Email atualizadas:
- Host SMTP: `smtp.mailmarcoscarequinho.com.br`
- Porta: `587`
- Usuário: `contato@mail.marcoscarequinho.com.br`
- Senha: `sua 031205`
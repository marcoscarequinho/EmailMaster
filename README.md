# EmailMaster Pro 📧

Sistema profissional de gerenciamento de email com interface moderna e servidor SMTP real.

## 🚀 Características

- **Sistema de Email Real**: Integração SMTP para envio de emails externos
- **Interface Moderna**: React + TypeScript + Tailwind CSS
- **Autenticação Robusta**: Sistema de sessões com hierarquia de usuários
- **Gerenciamento de Domínios**: Controle completo de domínios de email
- **Sistema Híbrido**: Emails internos + externos via SMTP
- **Auditoria**: Logs completos de ações administrativas

## 🏗️ Arquitetura

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** + **shadcn/ui** para interface
- **TanStack Query** para gerenciamento de estado
- **Wouter** para roteamento

### Backend
- **Node.js** + **Express** + TypeScript
- **PostgreSQL** + **Drizzle ORM** 
- **Passport.js** para autenticação
- **Nodemailer** para servidor SMTP
- **bcrypt** para criptografia de senhas

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL database (recomendado: Neon)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/emailmaster-pro.git
cd emailmaster-pro
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
DATABASE_URL=postgresql://user:pass@host/database
SESSION_SECRET=your-secret-key-here
NODE_ENV=development

# SMTP Configuration (opcional - para emails reais)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua_senha_de_aplicativo
```

### 4. Configure o banco de dados
```bash
npm run db:push
```

### 5. Execute o projeto
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5000`

## 👤 Hierarquia de Usuários

- **Super Admin**: Acesso total ao sistema
- **Admin**: Gerencia usuários e domínios do seu domínio
- **Cliente**: Acesso básico ao email

### Credenciais de Demonstração
- **Super Admin**: `0admin` / `BB03@5bb03#5`

## 📧 Configuração de Email

### Para Gmail
1. Habilite autenticação em 2 fatores
2. Crie uma senha de aplicativo
3. Configure no `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=senha_de_aplicativo_aqui
```

### Para outros provedores
Configure SMTP_HOST, SMTP_PORT conforme seu provedor.

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento com hot-reload
npm run build        # Build para produção
npm run start        # Inicia servidor de produção
npm run db:push      # Aplica mudanças no schema do banco
npm run check        # Type checking
```

## 📁 Estrutura do Projeto

```
EmailMaster/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilitários
├── server/                # Backend Node.js
│   ├── auth.ts           # Sistema de autenticação
│   ├── routes.ts         # Definição de rotas
│   ├── storage.ts        # Camada de dados
│   ├── emailService.ts   # Servidor SMTP
│   └── db.ts            # Conexão com banco
├── shared/               # Tipos e schemas compartilhados
│   └── schema.ts        # Schemas Drizzle + Zod
└── scripts/             # Scripts utilitários
```

## 🌟 Funcionalidades

### ✅ Implementadas
- [x] Sistema de autenticação completo
- [x] Gerenciamento de usuários e permissões
- [x] Interface de email (compose, folders)
- [x] Servidor SMTP real integrado
- [x] Gerenciamento de domínios
- [x] Logs de auditoria
- [x] Sistema de busca de usuários
- [x] Modo híbrido (interno + externo)

### 🔄 Em desenvolvimento
- [ ] Recebimento de emails via IMAP
- [ ] Filtros e regras de email
- [ ] Anexos de arquivo
- [ ] Templates de email
- [ ] API REST completa

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma [issue](https://github.com/seu-usuario/emailmaster-pro/issues)
- Email: seu-email@dominio.com

---

Desenvolvido com ❤️ por [Seu Nome]
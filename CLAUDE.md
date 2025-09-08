# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Start development server with hot reloading
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Start production server
npm run start

# Push database schema changes
npm run db:push
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon serverless) + Drizzle ORM
- **UI Components**: Radix UI + shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter (client) + Express (server)
- **Authentication**: Passport.js with local strategy + express-session

### Project Structure
```
/
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/   # UI components (shadcn/ui + custom)
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and configurations
├── server/               # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── auth.ts           # Authentication setup
│   ├── storage.ts        # Database operations layer
│   └── db.ts             # Database connection
├── shared/               # Shared types and schemas
│   └── schema.ts         # Drizzle ORM schemas + Zod validation
└── attached_assets/      # Static assets
```

### Key Architectural Patterns

#### Authentication Flow
- Password-based authentication using Passport local strategy
- Server-side sessions stored in PostgreSQL
- Role-based access control (super_admin > admin > client)
- Session cookies with 24-hour expiration

#### Database Schema
- **users**: User accounts with roles and domain associations
- **domains**: Email domain management
- **emails**: Email messages with folder organization
- **sessions**: Express session storage
- **audit_logs**: Admin action tracking

#### API Structure
All API endpoints are prefixed with `/api` and follow RESTful conventions:
- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management (admin only)
- `/api/domains/*` - Domain management (admin only)
- `/api/emails/*` - Email operations

#### Frontend Routing
- `/` - Home page (authenticated) or Auth page (unauthenticated)
- `/auth` - Authentication page
- `/admin/users` - User management (admin/super_admin)
- `/admin/domains` - Domain management (admin/super_admin)
- `/admin/settings` - Admin settings

### Development Considerations

#### Path Aliases
- `@/` - Maps to `client/src/`
- `@shared/` - Maps to `shared/`
- `@assets/` - Maps to `attached_assets/`

#### Environment Variables
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (optional, has default for dev)
- `NODE_ENV` - Environment mode (development/production)

#### Role Hierarchy
- **super_admin**: Full system access, can manage all users and domains
- **admin**: Can manage users and domains within their domain
- **client**: Basic email access only

#### Session Management
- Sessions persist in PostgreSQL using connect-pg-simple
- HTTP-only cookies prevent XSS attacks
- 24-hour session timeout
- Automatic session cleanup via PostgreSQL expire index

### Common Tasks

#### Adding New API Endpoints
1. Define route handler in `server/routes.ts`
2. Add database operations in `server/storage.ts`
3. Update schema if needed in `shared/schema.ts`
4. Add TypeScript types for request/response

#### Creating UI Components
1. Use existing shadcn/ui components from `client/src/components/ui/`
2. Follow the established pattern of using Radix UI primitives
3. Apply Tailwind CSS classes for styling
4. Use TanStack Query for server state management

#### Database Migrations
1. Modify schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Note: This uses push method, not migration files
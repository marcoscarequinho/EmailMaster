# Overview

This is a full-stack email management application built with React, Express, and PostgreSQL. The system features role-based user authentication through Replit Auth, a modern email client interface, and comprehensive user management capabilities. The application supports three user roles (super_admin, admin, client) with varying levels of access to email functionality and administrative features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with role-based authorization middleware
- **Session Management**: Express sessions with PostgreSQL storage for persistent authentication
- **Authentication**: Replit Auth integration with OpenID Connect protocol

## Data Storage
- **Primary Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle migrations for version-controlled database changes
- **Session Storage**: PostgreSQL table for server-side session persistence
- **User Management**: Hierarchical role system (super_admin > admin > client)

## Authentication and Authorization
- **Authentication Provider**: Replit Auth using OpenID Connect
- **Session Strategy**: Server-side sessions with HTTP-only cookies
- **Authorization**: Role-based access control with route-level protection
- **Security**: CSRF protection through session management and secure cookie configuration

## External Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service for user identity management
- **Font Services**: Google Fonts for typography (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)
- **Development Tools**: Replit development environment with hot reloading and error handling
- **CSS Framework**: Tailwind CSS with PostCSS for styling automation
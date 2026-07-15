# ADR-001: Architecture Foundation

## Context & Problem Statement

ArchitectAI requires a scalable, clean, and production-ready foundation to build an AI-powered Engineering Intelligence & System Design Platform. We need to decide on our monorepo tooling, frontend and backend frameworks, database persistence, and container infrastructure to set up a robust, developer-friendly base.

## Decision Drivers

- **Scale and Cleanliness**: Clear Separation of Concerns (SoC) between client and server.
- **Developer Experience (DX)**: Quick setup, rapid feedback loops, type safety across borders.
- **Robustness**: Maintainable logging, exception filtering, configurations validation.
- **Deployment**: Ease of containerizing and orchestrating services.

## Considered Options

- **Monorepo Management**: Turborepo, Nx, or plain `pnpm` workspaces.
- **Backend Frameworks**: Express, Fastify, NestJS.
- **Frontend Frameworks**: Vite SPA, Next.js.
- **Database ORM**: TypeORM, Sequelize, Prisma.

## Decision Outcome

We decided on the following foundation stack:

1. **Next.js 15 (Frontend)**: Offers Server Components, App Router for clean page structures, and simplified server-side rendering support.
2. **NestJS v10 (Backend)**: Provides an enterprise-ready modular structure with dependency injection, standardizing route controllers, interceptors, services, and loggers.
3. **PostgreSQL + Prisma (Database & ORM)**: PostgreSQL offers robust relational storage, and Prisma provides auto-generated type-safe clients derived directly from schema definitions.
4. **pnpm Workspaces (Monorepo)**: Simplest approach for linking a multi-project workspace (`frontend` + `backend` + `packages/shared`) without unnecessary Nx/Turbo config overhead initially.
5. **Docker Compose**: Ensures developer environment consistency by running PostgreSQL and Redis under identical container environments.
6. **Modular Monolith Architecture**: Avoids premature microservice distributed networking overhead while enforcing decoupled boundaries via registered backend sub-modules and shared workspace dependencies.

## Pros and Cons of Decisions

### Next.js

- **Pros**: Inbuilt router, image optimization, simple production builds.
- **Cons**: Slightly higher learning curve than plain Vite.

### NestJS

- **Pros**: Excellent documentation, clean structure, DI container.
- **Cons**: Uses TypeScript decorators heavily, which requires proper configuration.

### Prisma

- **Pros**: Type safety, visual schema model mapping.
- **Cons**: Schema features are centralized and can become large; mitigable via separation strategies.

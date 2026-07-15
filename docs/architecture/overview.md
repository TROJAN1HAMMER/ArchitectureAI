# Architecture Overview

This document describes the high-level architecture of the **ArchitectAI** platform.

## Technology Stack

The project is designed as a **Modular Monolith** using a monorepo structure managed by `pnpm` workspaces:

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, TanStack Query, Axios.
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis, Winston (logging), Zod validation.
- **Shared**: TypeScript package (`@architect-ai/shared`) sharing DTOs, schemas, constants, and utilities.
- **Infrastructure**: Docker Compose, PostgreSQL (database), Redis (caching and queues).

## Architecture Layout

```text
+-----------------------+
|  Next.js 15 Frontend  |
+-----------+-----------+
            |
            | HTTP / REST (Axios)
            v
+-----------+-----------+      +--------------------------+
|   NestJS v10 Backend  |<---->| @architect-ai/shared     |
+-----+-----------+-----+      | (Types, Schemas, Consts) |
      |           |            +--------------------------+
      | Prisma    | Redis Client
      v           v
+-----+-----+   +-+---------+
|PostgreSQL |   |   Redis   |
+-----------+   +-----------+
```

## Folder Structure

- `frontend/`: React components, views, layout, and client-side hooks.
- `backend/`: Core business logic services, controllers, middlewares, filters, and interceptors.
- `packages/shared/`: Cross-boundary validation schemas, TypeScript interfaces, and shared constants.
- `docs/`: ADR logs and architecture design docs.

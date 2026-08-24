# Architecture Overview

This document describes the high-level architecture of the **ArchitectAI** platform.

## Technology Stack

The project is designed as a **Modular Monolith** using a monorepo structure managed by `pnpm` workspaces:

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, next-themes (Dark/Light), TanStack Query, Axios.
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis (`ioredis`), Winston (logging), Zod validation.
- **Shared**: TypeScript package (`@architect-ai/shared`) sharing DTOs, schemas, constants, and utilities.
- **Infrastructure**: Docker Compose, PostgreSQL (database), Redis (caching, locks).

## Architecture Layout

```text
+--------------------------------------------------------+
|                  Next.js 15 Frontend                   |
| (App Router, ThemeToggle, RepositoryCards, TreeView)   |
+---------------------------+----------------------------+
                            |
                            | HTTP / REST (Axios)
                            v
+---------------------------+----------------------------+      +--------------------------+
|                  NestJS v10 Backend                    |<---->| @architect-ai/shared     |
| (Auth, Users, Health, Repositories, Github, SyncService)  |      | (Types, Schemas, Consts) |
+-----+---------------------+----------------------+-----+      +--------------------------+
      |                     |                      |
      | Prisma ORM          | Redis Lock (EX 600)  | Octokit GitHub REST
      v                     v                      v
+-----+-----+         +-----+-----+          +-----+-----+
|PostgreSQL |         |   Redis   |          |  GitHub   |
+-----------+         +-----------+          +-----------+
```

## Repository Intelligence Flow

```text
GitHub REST API (Git Trees API)
   ↓
GitHubClientService (getRepositoryTree, getRepository)
   ↓
RepositorySyncService
   ├── 1. Verify user connection & ownership (RepositoryConnection)
   ├── 2. Acquire Redis Lock (key: repository:sync-lock:<id>, 600s TTL, NX)
   ├── 3. Create RepositorySync record (status: RUNNING)
   ├── 4. Update Repository metadata (language, stars, forks, isArchived)
   ├── 5. Bulk Upsert RepositoryFile tree (chunked transaction, unique(repositoryId, path))
   ├── 6. Update RepositorySync record (status: SUCCESS)
   └── 7. Release Redis Lock safely (matching UUID)
   ↓
PostgreSQL (Repository, RepositoryFile, RepositorySync)
   ↓
Repository Intelligence REST APIs (GET /repositories/:id/tree, /syncs)
   ↓
Next.js Repository UI (/repositories/[id])
```

## Folder Structure

- `frontend/`: React components, views, layout, and client-side hooks.
- `backend/`: Core business logic services, controllers, middlewares, filters, and interceptors.
- `packages/shared/`: Cross-boundary validation schemas, TypeScript interfaces, and shared constants.
- `docs/`: ADR logs, architecture design docs, release notes, and phase walkthroughs.

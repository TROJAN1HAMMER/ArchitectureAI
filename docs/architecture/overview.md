# Architecture Overview

This document describes the high-level architecture of the **ArchitectAI** platform.

## Technology Stack

The project is designed as a **Modular Monolith** using a monorepo structure managed by `pnpm` workspaces:

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, next-themes (Dark/Light), TanStack Query, Axios.
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL (`pgvector`), Redis (`ioredis`), Winston (logging), Zod validation.
- **Shared**: TypeScript package (`@architect-ai/shared`) sharing DTOs, schemas, constants, and utilities.
- **Infrastructure**: Docker Compose, PostgreSQL (`pgvector`), Redis (caching, locks).

## Architecture Layout

```text
+--------------------------------------------------------+
|                  Next.js 15 Frontend                   |
| (App Router, ThemeToggle, TreeView, GraphUI, SearchUI) |
+---------------------------+----------------------------+
                            |
                            | HTTP / REST (Axios)
                            v
+---------------------------+----------------------------+      +--------------------------+
|                  NestJS v10 Backend                    |<---->| @architect-ai/shared     |
| (Auth, Users, Health, Repositories, Graph, SemanticSearch)|      | (Types, Schemas, Consts) |
+-----+---------------------+----------------------+-----+      +--------------------------+
      |                     |                      |
      | Prisma ORM          | Redis Lock (EX 600)  | Octokit GitHub REST
      v                     v                      v
+-----+-----+         +-----+-----+          +-----+-----+
|PostgreSQL |         |   Redis   |          |  GitHub   |
| (pgvector)|         | (Locks)   |          | (REST API)|
+-----------+         +-----------+          +-----------+
```

## Repository Intelligence & Semantic Pipeline Flow

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
   ├── 6. Build Knowledge Graph (RepositoryGraphBuilderService)
   │      ├── REPOSITORY → DIRECTORY → FILE hierarchy (CONTAINS)
   │      └── Lightweight import extraction (IMPORTS, DEPENDS_ON)
   ├── 7. Build Semantic Search Index (SemanticIndexerService)
   │      ├── Searchable content extraction & context formatting
   │      ├── SHA-256 content hashing & idempotency check
   │      └── Vector embedding generation & persistence
   ├── 8. Update RepositorySync record (status: SUCCESS)
   └── 9. Release Redis Lock safely (matching UUID)
   ↓
PostgreSQL (Repository, RepositoryFile, GraphNode, GraphEdge, Embedding, SemanticIndex)
   ↓
REST APIs (GET /repositories/:id/tree, /graph, /search)
   ↓
Next.js Repository UI (/repositories/[id])
```

## Folder Structure

- `frontend/`: React components, views, layout, and client-side hooks.
- `backend/`: Core business logic services, controllers, middlewares, filters, and interceptors.
- `packages/shared/`: Cross-boundary validation schemas, TypeScript interfaces, and shared constants.
- `docs/`: ADR logs, architecture design docs, release notes, and phase walkthroughs.

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
| (App Router, ThemeToggle, TreeView, GraphUI, SearchUI, AIChat) |
+---------------------------+----------------------------+
                            |
                            | HTTP / REST (Axios)
                            v
+---------------------------+----------------------------+      +--------------------------+
|                  NestJS v10 Backend                    |<---->| @architect-ai/shared     |
| (Auth, Users, Health, Repos, Graph, Search, AiModule)  |      | (Types, Schemas, Consts) |
+-----+---------------------+----------------------+-----+      +--------------------------+
      |                     |                      |
      | Prisma ORM          | Redis Lock (EX 60/600)| Octokit GitHub REST
      v                     v                      v
+-----+-----+         +-----+-----+          +-----+-----+
|PostgreSQL |         |   Redis   |          |  GitHub   |
| (pgvector)|         | (Locks)   |          | (REST API)|
+-----------+         +-----------+          +-----------+
```

## Repository Intelligence & Grounded RAG Flow

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
PostgreSQL (Repository, RepositoryFile, GraphNode, GraphEdge, Embedding, Conversation)
   ↓
Grounded RAG Pipeline (RagService)
   ├── 1. Verify Repository Ownership (RepositoryConnection)
   ├── 2. Acquire Redis Lock (key: repository:ai-lock:<repo>:<user>, 60s TTL, NX)
   ├── 3. Parse User Query Intent (QueryUnderstandingService)
   ├── 4. Retrieve Vector + Graph Context (ContextRetrieverService)
   ├── 5. Weight & Rank Signals (ContextRankerService: Semantic 60%, Graph 25%, Lexical 15%)
   ├── 6. Format Bounded Context & System Prompt (ContextBuilderService: MAX_CONTEXT_CHARS)
   ├── 7. Execute LLM Provider (LLMProviderFactory / MockLLMProviderService)
   ├── 8. Persist Conversation & ConversationMessage History (ConversationService)
   └── 9. Release Redis Lock safely
   ↓
REST APIs (POST /repositories/:id/ai/chat, GET /conversations)
   ↓
Next.js AI Assistant Tab (/repositories/[id])
```

## Folder Structure

- `frontend/`: React components, views, layout, client-side hooks, and AI chat UI.
- `backend/`: Core business logic services, controllers, AI/RAG services, middlewares, filters, and interceptors.
- `packages/shared/`: Cross-boundary validation schemas, TypeScript interfaces, and shared constants.
- `docs/`: ADR logs, architecture design docs, release notes, and phase walkthroughs.

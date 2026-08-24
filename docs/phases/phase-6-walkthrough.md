# Walkthrough — Phase 6: Embedding & Semantic Search

## Objective

Build the first semantic intelligence layer of ArchitectAI. The system now extracts searchable content from repository files, generates vector embeddings, persists them in PostgreSQL (`pgvector`), performs similarity search, and exposes search capabilities via authenticated APIs and frontend components.

## Existing Foundation

Phase 6 builds directly upon:

- Monorepo structure (`pnpm` workspaces)
- NestJS backend + Next.js frontend
- PostgreSQL + Prisma ORM
- Redis infrastructure service
- JWT authentication + RBAC
- Repository Intelligence (Phase 4 `RepositoryFile`)
- Knowledge Graph (Phase 5 `GraphNode`)

## Database Changes

- **`Embedding` Model**: `id`, `repositoryId`, `fileId`, `graphNodeId`, `contentHash`, `content`, `chunkIndex`, `totalChunks`, `model`, `dimensions`, `metadata`.
  - Enforces uniqueness via `@@unique([repositoryId, fileId, chunkIndex, model])`.
- **`SemanticIndex` Model**: `id`, `repositoryId`, `status`, `filesDiscovered`, `filesProcessed`, `filesSkipped`, `filesFailed`, `startedAt`, `completedAt`, `errorMessage`.
- **Docker Compose**: Updated to `pgvector/pgvector:pg15`.
- **Migration**: Applied `20260824145147_add_semantic_search_foundation`.

## Services Implemented

- **`IEmbeddingProvider` & `MockEmbeddingProviderService`**: Interface abstraction and deterministic L2-normalized vector embedding generator.
- **`EmbeddingService`**: Handles embedding generation, dimension validation, content hash lookup, and persistence.
- **`SearchableContentService`**: Filters supported code & documentation files, injects repository context headers, computes SHA-256 content hashes, and chunks large files deterministically.
- **`SemanticIndexerService`**: Idempotent background indexing with Redis locking (`repository:embedding-lock:<id>`, TTL 600s, NX), stale embedding cleanup, and status tracking.
- **`SemanticSearchService`**: Performs query embedding, cosine similarity calculation, score ranking, file-collapsed result grouping, and ownership enforcement.

## API Endpoints

- `GET /api/v1/repositories/:id/search?q=...&limit=...` — Perform semantic similarity search.
- `GET /api/v1/repositories/:id/semantic-index` — Check semantic indexing status.
- `POST /api/v1/repositories/:id/semantic-index` — Trigger manual semantic indexing (HTTP 409 if locked).

## Frontend Components

- Created `frontend/src/components/semantic-search/`:
  - `SemanticIndexStatus.tsx`
  - `SemanticIndexButton.tsx`
  - `SemanticSearchBar.tsx`
  - `SemanticSearchResults.tsx`
- Updated `/repositories/[id]` detail page with an embedded Semantic Search tab supporting light and dark themes.

## Security

- All semantic search and indexing endpoints require JWT authentication.
- Strict ownership checks prevent cross-user IDOR access (returns HTTP 404/403).

## Verification Results

- `npx prisma generate` — PASS
- `pnpm --filter backend test` — PASS (19/19 test suites, 59/59 unit tests)
- `pnpm typecheck` — PASS (0 errors across all 3 workspace packages)
- `pnpm lint` — PASS (0 warnings/errors)
- `pnpm --filter backend build` — PASS
- `pnpm --filter frontend build` — PASS

## Documentation

- Updated `README.md`
- Updated `CHANGELOG.md`
- Created `docs/releases/v0.1.4-semantic-search.md`
- Created `docs/adr/ADR-006-semantic-search-foundation.md`
- Created `docs/phases/phase-6-walkthrough.md`
- Updated `docs/architecture/overview.md`

## Next Recommended Phase

**Phase 7: AI Repository Chat & RAG Foundation** — Building on top of RepositoryFiles, Knowledge Graph, and Semantic Vector Search to enable interactive AI codebase chat and architectural recommendations.

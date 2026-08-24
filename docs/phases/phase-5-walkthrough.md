# Walkthrough — Phase 5: Knowledge Graph Foundation

## Objective

Transform the persisted `RepositoryFile` data from Phase 4 into a PostgreSQL-backed code/system knowledge graph. ArchitectAI now represents repositories, directories, source files, and internal import dependencies as graph nodes (`GraphNode`) and directed relationships (`GraphEdge`), exposed through REST APIs and interactive UI interfaces.

## Existing Foundation

Phase 5 builds directly upon:

- Monorepo structure (`pnpm` workspaces)
- NestJS backend + Next.js frontend
- PostgreSQL + Prisma ORM
- Redis infrastructure service
- JWT authentication + HttpOnly refresh cookies + RBAC
- Repository Intelligence Foundation (Phase 4 `RepositoryFile` and `RepositorySync`)

## Database Changes

Extended `backend/prisma/schema.prisma` with:

- **`NodeType` Enum**: `REPOSITORY`, `DIRECTORY`, `FILE`, `MODULE`, `CLASS`, `FUNCTION`, `INTERFACE`, `COMPONENT`, `API_ENDPOINT`, `DATABASE_MODEL`.
- **`EdgeType` Enum**: `CONTAINS`, `IMPORTS`, `DEPENDS_ON`, `CALLS`, `EXTENDS`, `IMPLEMENTS`, `EXPOSES`, `USES`, `DEFINES`.
- **`GraphNode` Model**: `id`, `repositoryId`, `fileId`, `type`, `name`, `qualifiedName`, `path`, `metadata`, `createdAt`, `updatedAt` with `@@unique([repositoryId, qualifiedName])`.
- **`GraphEdge` Model**: `id`, `repositoryId`, `sourceNodeId`, `targetNodeId`, `type`, `metadata`, `createdAt`, `updatedAt` with `@@unique([repositoryId, sourceNodeId, targetNodeId, type])`.
- Applied migration `20260824143105_add_knowledge_graph_foundation`.

## Services Implemented

- **`KnowledgeGraphService`** (`backend/src/modules/knowledge-graph/knowledge-graph.service.ts`): Node and edge upserts, summary statistics, type breakdown counts, and depth-based neighborhood queries.
- **`RepositoryGraphBuilderService`** (`backend/src/modules/knowledge-graph/repository-graph-builder.service.ts`): Hierarchy construction, lightweight import extraction, and Redis graph locking (`repository:graph-lock:<repositoryId>`, TTL 600s, NX).
- **Automatic Integration**: Injected into `RepositorySyncService` to trigger graph construction automatically after successful repository file tree sync.

## API Endpoints

- `GET /api/v1/repositories/:id/graph` — Knowledge graph summary statistics and type breakdowns.
- `POST /api/v1/repositories/:id/graph/build` — Trigger manual graph build (HTTP 409 if locked).
- `GET /api/v1/repositories/:id/graph/nodes` — List and filter graph nodes (`type`, `search`, `limit`, `offset`).
- `GET /api/v1/repositories/:id/graph/edges` — List and filter graph edges (`type`, `sourceNodeId`, `targetNodeId`).
- `GET /api/v1/repositories/:id/graph/neighborhood/:nodeId` — Neighborhood sub-graph query around a node.

## Frontend

- Created `frontend/src/components/knowledge-graph/`:
  - `GraphSummary.tsx`
  - `GraphBuildButton.tsx`
  - `GraphNodeList.tsx`
  - `GraphEdgeList.tsx`
  - `GraphNeighborhoodView.tsx`
- Updated `/repositories/[id]` detail page with an embedded Knowledge Graph tab supporting light and dark themes.

## Security

- All knowledge graph endpoints require JWT authentication.
- Strict ownership checks prevent cross-user IDOR access (returns HTTP 404/403).

## Testing

- Backend Jest tests: 14 test suites, 48 unit tests passed.
- Tested node/edge upserts, hierarchy creation, import path extraction, Redis lock collisions (409), and authorization guards.

## Verification Results

- `npx prisma generate` — PASS
- `pnpm --filter backend test` — PASS (48/48 tests)
- `pnpm typecheck` — PASS (0 errors across all 3 workspace packages)
- `pnpm lint` — PASS (0 warnings/errors)
- `pnpm --filter backend build` — PASS
- `pnpm --filter frontend build` — PASS

## Documentation

- Updated `README.md`
- Updated `CHANGELOG.md`
- Created `docs/releases/v0.1.3-knowledge-graph-foundation.md`
- Created `docs/adr/ADR-005-knowledge-graph-foundation.md`
- Created `docs/phases/phase-5-walkthrough.md`

## Known Limitations

- Deep AST semantic parsing (Tree-sitter) is deferred to future phases.
- External graph databases (Neo4j) and vector search (Qdrant) are deferred.

## Next Recommended Phase

**Phase 6: Embedding & Semantic Search** — Generating code embeddings and enabling semantic code search across the knowledge graph.

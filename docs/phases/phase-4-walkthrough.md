# Walkthrough — Phase 4: Repository Intelligence Foundation

## Objective

Transform the GitHub repository connection layer into a Repository Intelligence Foundation. ArchitectAI now connects to GitHub repositories, triggers manual/initial syncs, fetches repository metadata and recursive file trees, persists normalized file entries idempotently in PostgreSQL, protects against concurrent syncs via Redis locking, and displays repository structures in the Next.js UI.

## Existing Foundation

Phase 4 builds directly upon:

- Monorepo structure (`pnpm` workspaces)
- NestJS backend + Next.js frontend
- PostgreSQL + Prisma ORM
- Redis infrastructure service
- JWT authentication + HttpOnly refresh cookies + RBAC
- GitHub OAuth integration & AES-256 encrypted access tokens

## Database Changes

Extended `backend/prisma/schema.prisma` with:

- **`RepositoryFile` model**: `id`, `repositoryId`, `path`, `name`, `extension`, `size`, `sha`, `type`, `parentPath`, `createdAt`, `updatedAt`, with `@@unique([repositoryId, path])`.
- **`Repository` model**: Added `language`, `stars`, `forks`, `isArchived`.
- **`RepositorySync` model**: Added `filesDiscovered`, `filesProcessed`.
- **`SyncTrigger` enum**: Added `INITIAL`.
- Created and executed migration `20260824141746_add_repository_files_and_sync_metadata`.

## GitHub Tree Retrieval

Extended `GithubClientService` (`backend/src/modules/github/github-client.service.ts`):

- Added `getRepositoryTree(token, owner, repo, branch)` using recursive tree retrieval.
- Extended `getRepository()` to return `language`, `stargazersCount`, `forksCount`, `archived`.
- Added `getFileContent()` stub.

## Repository Synchronization

Created `RepositorySyncService` (`backend/src/modules/repository/repository-sync.service.ts`):

- Ownership verification
- Redis lock acquisition (`repository:sync-lock:<id>`, TTL 600s, NX)
- Sync status lifecycle (`RUNNING` → `SUCCESS` or `FAILED`)
- Metadata update & recursive tree upserts (chunked transactions)
- Lock release in `finally` with UUID matching

## Redis Locking

- Utilizes existing `RedisService`.
- Concurrency protection key: `repository:sync-lock:<repositoryId>`.
- Returns HTTP 409 Conflict if sync is already running.

## API Endpoints

- `GET /api/v1/repositories/:id` — Repository detail + file count + last sync state.
- `GET /api/v1/repositories/:id/syncs` — Sync history list.
- `GET /api/v1/repositories/:id/tree` — Filtered file tree with `path` and `limit` support.
- `POST /api/v1/repositories/:id/sync` — Trigger manual sync.

## Frontend

- Created `RepositoryCard`, `RepositorySyncButton`, `RepositorySyncStatus`, and `RepositoryTree` components.
- Updated `/repositories` page with improved repository cards.
- Created `/repositories/[id]` detail page rendering repository statistics grid, file tree browser, and sync history table.

## Security

- All repository intelligence endpoints require JWT authentication.
- Strict ownership checks prevent cross-user IDOR access (returns HTTP 404/403).
- Encrypted tokens remain server-side and are never exposed in API responses.

## Testing

- Backend Jest tests: 12 test suites, 39 unit tests passed.
- Tested sync status lifecycle, tree upserts, lock collisions (409), GitHub error handling, and authorization guards.

## Verification Results

- `pnpm --filter backend test` — PASS (39/39 tests)
- `pnpm typecheck` — PASS (0 errors across all 3 workspace packages)
- `pnpm lint` — PASS (0 warnings/errors)
- `pnpm --filter backend build` — PASS
- `pnpm --filter frontend build` — PASS

## Documentation

- Updated `README.md`
- Updated `CHANGELOG.md`
- Created `docs/releases/v0.1.2-repository-intelligence.md`
- Created `docs/adr/ADR-004-repository-intelligence-foundation.md`
- Created `docs/phases/phase-4-walkthrough.md`

## Known Limitations

- Complete file content downloading and AST parsing are deferred to future AI intelligence phases.
- Scheduled cron background syncs will be implemented in future phases.

## Next Recommended Phase

**Phase 5: Knowledge Graph Foundation** — Modeling architecture entities, service relationships, and dependency graphs from persisted repository trees.

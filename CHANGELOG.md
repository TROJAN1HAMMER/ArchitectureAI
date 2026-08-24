# Changelog

All notable changes to this project will be documented in this file.

## [0.1.2-repository-intelligence] - 2026-08-24

### Added

- `RepositoryFile` model in Prisma schema with `(repositoryId, path)` unique constraint for idempotent file tree storage
- Extended `Repository` model with `language`, `stars`, `forks`, `isArchived` metadata fields
- Extended `RepositorySync` model with `filesDiscovered` and `filesProcessed` progress counters
- Added `INITIAL` to `SyncTrigger` enum
- `RepositorySyncService` with Redis synchronization lock (`repository:sync-lock:<id>`, 10-min TTL, NX) preventing concurrent sync collisions
- Extended `GithubClientService` with `getRepositoryTree` (recursive tree API) and extended repository attributes
- REST API endpoints:
  - `GET /api/v1/repositories/:id` (repository detail & file count)
  - `GET /api/v1/repositories/:id/syncs` (synchronization history)
  - `GET /api/v1/repositories/:id/tree` (file tree with path & limit filtering)
  - `POST /api/v1/repositories/:id/sync` (trigger manual sync)
- Frontend repository detail page (`/repositories/[id]`) with repository metadata stats grid, sync history table, and expandable `RepositoryTree` component
- `RepositoryCard`, `RepositorySyncButton`, `RepositorySyncStatus`, `RepositoryTree` components
- Complete test suite for `RepositorySyncService`, `RepositoriesService`, and `GithubClientService`

### Security

- Enforced user-scoped repository ownership check across all intelligence endpoints
- Non-owned or missing repository access returns HTTP 404/403 without leaking repository existence
- Preserved AES-256-GCM token encryption at rest with no token leakage to API responses

## [0.2.5] - 2026-08-24

### Added

- Request context correlation tracking (`X-Request-ID` response headers via `AsyncLocalStorage`)
- Structured logging interceptor printing request method, path, durations, and request IDs
- Redis infrastructure connection module using `ioredis` with connection listeners and retry strategy
- Central ErrorCode enum and error mapping configurations in exceptions filter
- Secure HTTP headers (Helmet)
- Strict origins CORS settings validation
- Uptime liveness probes and database/Redis ready probes health checks

### Changed

- Refactored `LoggerService` to dynamically format with active request ID
- Configured comma-separated origin strings validation for credentialed requests
- Upgraded Swagger OpenAPI description and health endpoint documentation

## [0.2.0] - 2026-08-23

### Added

- OWASP-aligned `argon2id` passwords hashing utility
- In-memory short-lived JWT access tokens and 7-day rotated `HttpOnly` refresh cookie lifecycles
- Database sessions audit logging and session revocation on logouts
- Role-Based Access Control decorators and guards mappings
- Client-side React `AuthProvider` memory tokens manager
- Axios concurrent API refresh interceptor queues

### Changed

- Configured Next.js protected routing layout groups

## [0.1.0] - 2026-07-16

### Added

- PNPM Workspace
- Next.js Frontend
- NestJS Backend
- Shared Package
- Docker Compose
- PostgreSQL
- Redis
- Prisma
- Logger Abstraction
- Health Module
- Swagger
- Global Config Validation
- CI/CD
- Husky
- Commitlint
- Lint Staged
- Makefile
- ADR-001

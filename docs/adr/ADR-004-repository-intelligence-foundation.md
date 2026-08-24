# ADR-004: Repository Intelligence Foundation

## Status

Accepted

## Context

ArchitectAI requires access to software repository structures to perform automated architecture discovery, system design knowledge graph construction, and quality auditing. Before building AI/LLM analysis, vector search, or AST parsers, the platform needs a reliable, idempotent, and normalized repository ingestion foundation.

## Decision

We decided to persist repository metadata and complete file tree structures in PostgreSQL before attempting deeper code intelligence:

1. **Relational Ingestion Schema (`RepositoryFile`)**:
   - Store normalized file paths, names, extensions, file sizes, SHAs, and tree types in PostgreSQL (`RepositoryFile`).
   - Use a composite unique constraint `@@unique([repositoryId, path])` to enforce database-level idempotency and prevent duplicate file records across multiple sync operations.

2. **Idempotent Synchronization Lifecycle**:
   - `RepositorySyncService` orchestrates synchronization transitions (`RUNNING` → `SUCCESS` or `FAILED`).
   - Use chunked transactions for bulk upserts to maintain performance while preserving data integrity.

3. **Redis Concurrency Lock**:
   - Use Redis `SET repository:sync-lock:<id> <uuid> EX 600 NX` to prevent simultaneous concurrent sync operations on the same repository.
   - If a sync request arrives while another sync is active, return an HTTP 409 Conflict response.
   - Safely release the lock in a `finally` block using lock value verification to prevent deleting locks belonging to subsequent operations.

4. **User-Scoped Access Control**:
   - All repository intelligence APIs verify active ownership via `RepositoryConnection` for the requesting user (`JwtAuthGuard`).
   - Non-owned or non-existent repository requests return HTTP 404/403 without revealing repository existence.

5. **Deferral of Heavy Components**:
   - Defer AST parsing, Tree-sitter, vector databases (Qdrant), graph databases (Neo4j), and LLM calls until the repository data foundation is proven.

## Consequences

### Positive

- Reliable foundation for system design discovery and code graph construction.
- Clean separation between ingestion and future AI analysis modules.
- Complete audit trail of sync execution history.
- Concurrency protection via Redis locking.

### Negative

- Initial sync for large repositories requires retrieving complete tree entries from GitHub REST API.

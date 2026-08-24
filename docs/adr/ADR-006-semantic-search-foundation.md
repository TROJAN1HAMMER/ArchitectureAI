# ADR-006: Semantic Search Foundation

## Status

Accepted

## Context

ArchitectAI requires semantic understanding of codebases to enable natural-language code search, architecture reasoning, and future RAG-backed AI chat. Rather than introducing external vector database services (such as Qdrant, Pinecone, or Weaviate) that add infrastructure overhead, the system needed an embedded, PostgreSQL-native vector similarity mechanism with robust security and idempotency.

## Decision

1. **PostgreSQL / pgvector Storage**:
   - Utilize `pgvector` (`pgvector/pgvector:pg15`) embedded within the existing PostgreSQL database.
   - Store vector embeddings in `Embedding` table with `@@unique([repositoryId, fileId, chunkIndex, model])` for idempotent chunk indexing.

2. **Provider Abstraction (`IEmbeddingProvider`)**:
   - Create `IEmbeddingProvider` interface decoupling search & indexing logic from specific provider APIs.
   - Implement `MockEmbeddingProviderService` for deterministic L2-normalized vector embeddings during development/offline testing, while permitting replacement with OpenAI or local providers.

3. **Content Hashing & Idempotent Indexing**:
   - `SearchableContentService` formats structured embedding input (`Repository`, `Path`, `Language`, `Chunk`) and calculates SHA-256 `contentHash`.
   - `SemanticIndexerService` checks `contentHash` before generating embeddings, skipping unchanged files during repeated syncs.

4. **Redis Indexing Concurrency Lock**:
   - Reuse existing `RedisService` (`repository:embedding-lock:<repositoryId>`, TTL 600s, NX) to prevent duplicate concurrent semantic indexing runs.

5. **Repository Ownership & IDOR Protection**:
   - Enforce user-scoped repository ownership (`RepositoryConnection`) on all search and indexing APIs using `JwtAuthGuard`.

## Consequences

### Positive

- Zero external vector database overhead; single source of truth in PostgreSQL.
- Idempotent indexing preventing unnecessary embedding regeneration.
- Provider-agnostic design.
- Complete API & UI semantic search interface.

### Negative

- Extremely large codebases (>100,000 files) will require batch vector insertion pipelines.

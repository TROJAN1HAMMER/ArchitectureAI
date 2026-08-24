# Changelog

All notable changes to this project will be documented in this file.

## [0.1.6-architecture-discovery] - 2026-08-24

### Added

- `ArchitectureAnalysis` and `ArchitectureFinding` models in Prisma schema with `ArchitectureFindingSeverity`, `ArchitectureFindingType`, and `ArchitectureAnalysisStatus` enums
- Migration `20260824153232_add_architecture_discovery_auditing`
- `ArchitectureDiscoveryService` for mapping `GraphNode` and `GraphEdge` records into logical architectural components (`frontend`, `service`, `api`, `database`, `shared`, `tests`)
- `ArchitectureAuditorService` for deterministic structural analysis:
  - DFS Tarjan's cycle detection (`CIRCULAR_DEPENDENCY`)
  - Dynamic threshold coupling analysis (`HIGH_COUPLING`, `DEPENDENCY_HOTSPOT`)
  - Architectural boundary violation detection (`BOUNDARY_VIOLATION`)
  - Orphan and oversized module detection (`ORPHAN_COMPONENT`, `LARGE_COMPONENT`)
- `ArchitecturePatternService` for evidence-backed pattern detection (`Modular Monolith`, `Service Layer Pattern`, `REST API Gateway`, `Component-Based Frontend`)
- `ArchitectureRiskService` for explainable 0–100 risk score and level calculation (`LOW`, `MODERATE`, `ELEVATED`, `HIGH`, `CRITICAL`)
- `ArchitectureAnalysisService` orchestrating analysis workflows and Redis locking (`repository:architecture-lock:<repositoryId>`, 600s TTL, `EX 600 NX`)
- `ArchitectureContextService` enriching Phase 7 RAG context with architecture findings and risk scores
- REST API endpoints under `ArchitectureController`:
  - `GET /api/v1/repositories/:id/architecture` (Summary & risk score)
  - `POST /api/v1/repositories/:id/architecture/analyze` (Trigger analysis, 409 if locked)
  - `GET /api/v1/repositories/:id/architecture/findings` (Filtered findings)
  - `GET /api/v1/repositories/:id/architecture/findings/:findingId` (Finding evidence detail)
  - `GET /api/v1/repositories/:id/architecture/components` (Discovered components)
  - `GET /api/v1/repositories/:id/architecture/history` (Analysis run history)
- Frontend Architecture Audit tab (`ArchitectureOverview`, `ArchitectureRiskScore`, `ArchitectureFindings`, `ArchitectureComponents`, `ArchitecturePatterns`, `ArchitectureAnalysisButton`, `ArchitectureHistory`, `ArchitectureFindingDetail`) integrated into `/repositories/[id]` page
- Unit test suites for discovery, auditor, pattern detection, risk scoring, analysis orchestrator, controller, and dedicated integration test (`architecture-analysis.integration.spec.ts`)

### Security

- Strictly enforced user repository ownership verification on all architecture endpoints (returns HTTP 404/403)
- Redis request locking prevents concurrent duplicate architecture analysis collisions (returns HTTP 409 Conflict)

## [0.1.5-ai-rag-foundation] - 2026-08-24

### Added

- `Conversation` and `ConversationMessage` models in Prisma schema with `MessageRole` enum (`USER`, `ASSISTANT`) and user/repository ownership indexes
- Migration `20260824151754_add_ai_rag_foundation`
- Provider-agnostic LLM interface (`ILLMProvider`, `LLMGenerationRequest`, `LLMGenerationResponse`)
- `MockLLMProviderService` for offline, deterministic response generation without external API keys
- `LLMProviderFactory` resolving provider strategy via `LLM_PROVIDER` (default: `mock`)
- `QueryUnderstandingService` for natural-language query intent parsing (`architecture`, `security`, `general`), keywords, and target graph node/edge types
- `ContextRetrieverService` composing `SemanticSearchService` and `KnowledgeGraphService`
- `ContextRankerService` multi-signal ranker (Semantic: 60%, Graph: 25%, Lexical: 15%) with chunk deduplication
- `ContextBuilderService` compiling bounded context (`MAX_CONTEXT_CHARS`, default: 8000) and generating prompt injection isolation prompts treating repository code strictly as untrusted DATA
- `ConversationService` for user- and repository-isolated conversation management
- `RagService` orchestrating Redis concurrency locking (`repository:ai-lock:<repositoryId>:<userId>`, TTL 60s, `EX 60 NX`), retrieval, LLM execution, message persistence, and grounded fallback responses
- REST API endpoints under `AiController`:
  - `POST /api/v1/repositories/:id/ai/chat` (AI repository chat)
  - `GET /api/v1/repositories/:id/ai/conversations` (List user conversations for repository)
  - `GET /api/v1/repositories/:id/ai/conversations/:conversationId` (Get conversation message history)
  - `DELETE /api/v1/repositories/:id/ai/conversations/:conversationId` (Delete conversation)
- Frontend AI Assistant components (`AIChat`, `AIMessage`, `AISourceList`, `AIChatInput`, `ConversationList`) integrated into `/repositories/[id]` detail page as **"AI Assistant ✨"** tab with light/dark theme support
- Complete unit and integration test suite (`ai-rag.integration.spec.ts`) covering RAG lifecycle, context ranking, conversation history, IDOR rejection, and Redis lock collision (409 Conflict)

### Security

- Prompt injection isolation: System prompts explicitly treat retrieved code as untrusted DATA and reject code-level override instructions
- Strict repository and conversation ownership verification across all AI endpoints (returns HTTP 404/403)
- Redis request locking prevents duplicate concurrent AI request collisions

## [0.1.4-semantic-search] - 2026-08-24

### Added

- PostgreSQL pgvector image (`pgvector/pgvector:pg15`) in `docker-compose.yml`
- `Embedding` and `SemanticIndex` models in Prisma schema with `(repositoryId, fileId, chunkIndex, model)` unique constraint
- Migration `20260824145147_add_semantic_search_foundation`
- Embedding provider abstraction (`IEmbeddingProvider`) and `MockEmbeddingProviderService` for deterministic L2-normalized vector embeddings
- `EmbeddingService` for vector dimension validation, content hashing, and persistence
- `SearchableContentService` for file filtering, structured input context formatting, SHA-256 hashing, and deterministic chunking
- `SemanticIndexerService` for Redis-locked (`repository:embedding-lock:<id>`, 10-min TTL, EX NX) idempotent background indexing and stale embedding removal
- `SemanticSearchService` for query vector generation, repository-scoped cosine similarity scoring, and file-collapsed search results ranking
- Semantic Search REST API endpoints:
  - `GET /api/v1/repositories/:id/search?q=...&limit=...` (semantic similarity search)
  - `GET /api/v1/repositories/:id/semantic-index` (indexing status)
  - `POST /api/v1/repositories/:id/semantic-index` (trigger manual semantic indexing)
- Frontend Semantic Search components (`SemanticIndexStatus`, `SemanticIndexButton`, `SemanticSearchBar`, `SemanticSearchResults`) embedded in `/repositories/[id]` page with dark/light mode support
- Automated semantic indexing trigger injected post-Knowledge Graph build in `RepositorySyncService`
- Unit test suites for `EmbeddingService`, `SearchableContentService`, `SemanticIndexerService`, `SemanticSearchService`, and `SemanticSearchController`
- Environment schema validation for `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`, `EMBEDDING_MAX_FILE_SIZE`, `EMBEDDING_CHUNK_SIZE`, and `EMBEDDING_CHUNK_OVERLAP`

### Security

- Enforced user-scoped repository ownership check across all semantic search and indexing endpoints
- Non-owned or missing repository access returns HTTP 404/403 without leaking repository existence
- Vector search queries are strictly isolated to user-owned repositories

## [0.1.3-knowledge-graph-foundation] - 2026-08-24

### Added

- `GraphNode` and `GraphEdge` models in Prisma schema with `NodeType` and `EdgeType` enums
- PostgreSQL composite unique constraints `@@unique([repositoryId, qualifiedName])` and `@@unique([repositoryId, sourceNodeId, targetNodeId, type])`
- `KnowledgeGraphService` supporting node/edge CRUD, stats breakdowns, filtering, and neighborhood sub-graph traversal
- `RepositoryGraphBuilderService` for deterministic repository/directory/file hierarchy construction and Redis graph build locking (`repository:graph-lock:<id>`, 10-min TTL, NX)
- Lightweight import extraction heuristics for TypeScript, JavaScript, Python, and Java files
- Automatic knowledge graph construction triggered upon successful repository file tree sync
- Knowledge Graph REST API endpoints:
  - `GET /api/v1/repositories/:id/graph` (summary statistics)
  - `POST /api/v1/repositories/:id/graph/build` (trigger manual graph construction)
  - `GET /api/v1/repositories/:id/graph/nodes` (list/filter graph nodes)
  - `GET /api/v1/repositories/:id/graph/edges` (list/filter graph edges)
  - `GET /api/v1/repositories/:id/graph/neighborhood/:nodeId` (inspect node neighborhood)
- Frontend Knowledge Graph interface (`GraphSummary`, `GraphBuildButton`, `GraphNodeList`, `GraphEdgeList`, `GraphNeighborhoodView`) embedded in `/repositories/[id]` page with dark/light mode support
- Unit test suite for `KnowledgeGraphService` and `RepositoryGraphBuilderService`

### Security

- Enforced user-scoped repository ownership check across all knowledge graph endpoints
- Non-owned or missing repository access returns HTTP 404/403 without leaking repository existence

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

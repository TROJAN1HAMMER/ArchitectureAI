# Changelog

All notable changes to this project will be documented in this file.

## [0.1.9-production-hardening] - 2026-08-24

### Added

- Production Configuration Validation Zod schema in `backend/src/common/config/validation.ts` validating `NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ALLOWED_ORIGINS`, `LOG_LEVEL`, `RATE_LIMIT_TTL`, `RATE_LIMIT_LIMIT`, `OTEL_ENABLED`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `MAX_REQUEST_BODY_SIZE`
- Refined validation rule prohibiting wildcard `CORS_ALLOWED_ORIGINS="*"` in production mode
- `@nestjs/throttler` integration with global `ThrottlerGuard` registered via `APP_GUARD` and `@Throttle(...)` decorators on sync, indexing, AI chat, architecture analyze, system design generate, and governance review endpoints returning HTTP 429 (`RATE_LIMIT_EXCEEDED`)
- Bounded payload size handling via `MAX_REQUEST_BODY_SIZE` (default `'10mb'`)
- Standardized `AllExceptionsFilter` error envelope with top-level `requestId` propagation
- `LoggerService` credential sanitization automatically redacting JWTs, secret keys, passwords, bearer tokens
- Production Health & Readiness endpoints (`GET /health`, `GET /health/live`, `GET /health/ready`) verifying PostgreSQL, Redis, and `pgvector` extension availability (returns HTTP 200 or 503)
- `RedisLockService` in `backend/src/common/redis/redis-lock.service.ts` encapsulating safe token-matched Redis locks
- `TelemetryService` in `backend/src/common/telemetry/telemetry.service.ts` for OpenTelemetry span tracing (`repository.sync`, `graph.build`, `semantic.index`, `semantic.search`, `ai.rag`, `architecture.analyze`, `system_design.generate`, `governance.review`) without exposing code content
- Production deployment configuration `docker-compose.prod.yml` with healthchecks, persistent volumes, restart policies (`restart: unless-stopped`), and NestJS `app.enableShutdownHooks()`
- Frontend `api.ts` error message formatting and rate-limit handling (429)
- Unit and integration test suite (`security.spec.ts`, `production-readiness.integration.spec.ts`)

### Security

- Enforced user repository connection ownership verification across all endpoints (multi-tenant IDOR protection)
- Non-owned repository resource requests return HTTP 404/403 without leaking existence
- Helmet security headers and strict CORS configuration

## [0.1.8-architecture-governance] - 2026-08-24

### Added

- `ArchitectureSnapshot`, `ArchitectureSnapshotNode`, `ArchitectureSnapshotEdge`, `ArchitectureDiff`, `ArchitectureDiffItem`, `GovernanceRule`, and `GovernanceViolation` models in Prisma schema with `GovernanceRuleSeverity`, `GovernanceViolationStatus`, `ArchitectureDiffStatus`, `ArchitectureDiffItemType`, and `GovernanceReviewStatus` enums
- Migration `20260824160645_add_architecture_governance`
- `ArchitectureSnapshotService` for creating and listing deterministic architectural snapshots
- `ArchitectureDiffService` for comparing snapshot states and detecting added/removed components, dependency changes, and risk score deltas
- `GovernanceRuleService` for seeding default rules (`NO_CIRCULAR_DEPENDENCY`, `NO_FRONTEND_TO_DATABASE`, `NO_DATABASE_TO_FRONTEND`, `EXCESSIVE_COUPLING`, `RISK_SCORE_THRESHOLD`) and rule CRUD operations
- `GovernanceEngineService` for evaluating governance rules deterministically against analysis findings and diffs
- `GovernanceReviewService` orchestrating governance reviews and Redis concurrency locking (`repository:governance-lock:<repositoryId>`, TTL 600s, `EX 600 NX`)
- `GovernanceContextService` enriching Phase 7 RAG assistant context with governance review results and violations
- REST API endpoints under `GovernanceController`:
  - `GET /api/v1/repositories/:id/governance` (Get governance summary & review status)
  - `POST /api/v1/repositories/:id/governance/review` (Run automated governance review, 409 if locked)
  - `GET /api/v1/repositories/:id/governance/snapshots` (List architecture snapshots)
  - `GET /api/v1/repositories/:id/governance/snapshots/:snapshotId` (Get snapshot detail)
  - `GET /api/v1/repositories/:id/governance/diffs` (List architecture diffs)
  - `GET /api/v1/repositories/:id/governance/diffs/:diffId` (Get architecture diff detail)
  - `GET /api/v1/repositories/:id/governance/violations` (List filterable violations)
  - `PATCH /api/v1/repositories/:id/governance/violations/:violationId` (Update violation status)
  - `GET /api/v1/repositories/:id/governance/rules` (List rules)
  - `POST /api/v1/repositories/:id/governance/rules` (Create custom rule)
  - `PATCH /api/v1/repositories/:id/governance/rules/:ruleId` (Update rule settings)
  - `DELETE /api/v1/repositories/:id/governance/rules/:ruleId` (Delete rule)
- Frontend Governance tab (`GovernanceOverview`, `GovernanceStatusBadge`, `GovernanceRiskDelta`, `GovernanceViolationTable`, `GovernanceRules`, `ArchitectureDiffViewer`, `ArchitectureSnapshotList`, `GovernanceReviewButton`, `GovernanceFindingDetail`) integrated into `/repositories/[id]` page
- Unit test suites for snapshot, diff, rule, engine, review service, controller, and dedicated integration test (`governance.integration.spec.ts`)

### Security

- Strictly enforced user repository ownership verification on all governance endpoints (returns HTTP 404/403)
- Redis review locking prevents concurrent duplicate governance review execution jobs (returns HTTP 409 Conflict)

## [0.1.7-system-design-studio] - 2026-08-24

### Added

- `SystemDesign`, `Diagram`, `DiagramNode`, and `DiagramEdge` models in Prisma schema with `DiagramType`, `DiagramNodeType`, and `DiagramEdgeType` enums
- Migration `20260824155728_add_system_design_studio`
- `SystemDesignDiscoveryService` for mapping Knowledge Graph nodes and edges into C4 elements
- `DiagramGenerationService` generating C4 System Context, Container, and Component diagrams
- `DiagramLayoutService` computing deterministic layout positioning
- `SystemDesignService` orchestrating diagram generation and Redis locking (`system-design:generate-lock:<repositoryId>`, TTL 600s, `EX 600 NX`)
- `SystemDesignContextService` enriching RAG assistant context with C4 system design overview
- Frontend System Design Studio tab (`SystemDesignStudio`, `DiagramCanvas`, `DiagramToolbar`, `DiagramNode`, `DiagramEdge`, `DiagramLegend`, `DiagramNodeDetails`, `DiagramFilters`, `DiagramTypeSelector`, `SystemDesignOverview`, `SystemDesignGenerateButton`, `SystemDesignExportButton`) integrated into `/repositories/[id]` page

## [0.1.6-architecture-discovery] - 2026-08-24

### Added

- `ArchitectureAnalysis` and `ArchitectureFinding` models in Prisma schema
- `ArchitectureDiscoveryService` mapping GraphNodes/GraphEdges to architectural components
- `ArchitectureAuditorService` for cycle detection, coupling metrics, and boundary violations
- `ArchitecturePatternService` for pattern detection
- `ArchitectureRiskService` for risk scoring (0-100)
- `ArchitectureAnalysisService` orchestrating analysis workflows and Redis locking
- Frontend Architecture Audit tab integrated into `/repositories/[id]` page

## [0.1.5-ai-rag-foundation] - 2026-08-24

### Added

- `Conversation` and `ConversationMessage` models in Prisma schema
- Bounded RAG pipeline and `MockLLMProviderService`
- Prompt injection isolation
- Grounded source citations
- Frontend AI Assistant chat tab

## [0.1.4-semantic-search] - 2026-08-24

### Added

- PostgreSQL pgvector image (`pgvector/pgvector:pg15`)
- `Embedding` and `SemanticIndex` models
- `SemanticSearchService` and `SemanticIndexerService`
- Frontend Semantic Search UI

## [0.1.3-knowledge-graph-foundation] - 2026-08-24

### Added

- `GraphNode` and `GraphEdge` models
- `RepositoryGraphBuilderService`
- Frontend Knowledge Graph Inspector

## [0.1.2-repository-intelligence] - 2026-08-24

### Added

- `RepositoryFile` model for normalized file tree storage
- Git file tree sync service and frontend file tree navigation

## [0.2.5] - 2026-08-24

### Added

- Request context correlation tracking (`X-Request-ID`)
- Redis connection manager
- Helmet security headers and CORS validation

## [0.2.0] - 2026-08-23

### Added

- OWASP-aligned `argon2id` passwords hashing
- JWT access tokens and HttpOnly refresh cookies

## [0.1.0] - 2026-07-16

### Added

- Initial PNPM workspace monorepo

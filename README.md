# ArchitectAI

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-compose-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

ArchitectAI is an AI-powered Multi-Repository Engineering Intelligence, Enterprise System Design & Autonomous Code Remediation Platform. It digests git repositories, database schemas, and service interaction flows to construct comprehensive architecture insights, enterprise topology graphs, system design diagrams, automated design audits, governance policy reviews, and safe automated code refactoring Pull Requests under a strict Human Approval Boundary.

---

## Vision

ArchitectAI aims to bridge the gap between abstract software architecture and actual repository implementations. By modeling the codebase as an enterprise system design knowledge graph, semantic vector index, grounded AI assistant, C4 diagram studio, governance review engine, and autonomous remediation agent, it provides engineers with:

1. **Automated Discovery**: Up-to-date visualization of system topologies, components, and multi-repository microservice networks.
2. **Multi-Repository Architecture Federation**: Registration of enterprise systems, inter-service dependency discovery, enterprise topology auditing, cross-boundary violation detection, and deterministic risk scoring (0–100).
3. **Semantic Search & Intelligence**: Vector similarity search over codebases with contextual snippet chunking and ownership security.
4. **Grounded AI Repository Assistant**: Natural-language repository and enterprise system Q&A powered by RAG context combining vector search, knowledge graph relationships, architecture findings, C4 diagrams, governance review diffs, remediation PR status, and enterprise system topology.
5. **Automated Architecture Auditing**: Deterministic cycle detection, coupling metrics, boundary violation checks, pattern detection, and structural risk scoring.
6. **Interactive System Design Studio**: Automated generation of C4 System Context, Container, and Component diagrams with interactive canvas editing and SVG/JSON export.
7. **Architecture Review & Governance Workflows**: Automated snapshot comparisons over releases, component & dependency diffs, risk score deltas, governance policy enforcement, and review status evaluation (`PASS`, `PASS_WITH_WARNINGS`, `FAILED`).
8. **Autonomous Refactoring & Remediation Agents**: Planning, patch generation, sandbox validation (typecheck, lint, test), stale patch protection, git branch creation, and Pull Request generation for architectural findings under a strict **Human Approval Boundary** (no automatic merging).
9. **Production Hardening & Deployment Readiness**: API rate limiting, multi-tenant IDOR protection, request correlation tracing, credential sanitization, OpenTelemetry observability, health probes, and Docker production manifests.

---

## Current Status

**Active Version**: `v0.2.1-enterprise-topology`  
The project has completed **Phases 1 through 13**. The system features a complete end-to-end multi-repository intelligence and remediation pipeline:

- **Authentication Foundation**: OWASP-aligned `argon2id` passwords, short-lived (15-min) in-memory JWTs, 7-day rotated `HttpOnly` refresh cookies, and session-level database auditing.
- **Central Redis Cache & Coordination**: Global Redis connections via `ioredis` with exponential backoff retries, clean shutdowns, and reusable Redis locks (`RedisLockService`).
- **Production API Throttling**: Rate limiting via `@nestjs/throttler` (`RATE_LIMIT_TTL`, `RATE_LIMIT_LIMIT`) protecting endpoints against abuse and returning HTTP 429 (`RATE_LIMIT_EXCEEDED`).
- **Request Correlation**: Correlation IDs (`X-Request-ID`) mapped via `AsyncLocalStorage`, included in response headers, structured logs, and error envelopes.
- **Structured Logging & Sanitization**: Winston logger wrapper with automatic redaction of JWTs, passwords, secrets, and bearer tokens.
- **Security Hardening**: Secure headers (Helmet), payload body size limits (`MAX_REQUEST_BODY_SIZE`), and strict CORS origin validation.
- **Health Checks & Readiness**: Liveness (`/health/live`) and readiness (`/health/ready`) endpoints verifying PostgreSQL, Redis, and `pgvector` extension availability status.
- **GitHub Integration (Phase 3)**: GitHub OAuth service, repository module scaffolding, AES-256 encrypted token storage, and linked repository management.
- **Repository Intelligence Foundation (Phase 4)**: Normalized file tree ingestion (`RepositoryFile`), idempotent upserts, sync lifecycle tracking (`PENDING`/`RUNNING`/`SUCCESS`/`FAILED`), and REST endpoints for repository details, sync history, and tree navigation.
- **Knowledge Graph Foundation (Phase 5)**: PostgreSQL-backed graph models (`GraphNode` and `GraphEdge`), `NodeType` and `EdgeType` enums, deterministic hierarchy creation, lightweight import/dependency extraction, graph neighborhood traversal API, and interactive UI graph inspector.
- **Semantic Search Foundation (Phase 6)**: PostgreSQL pgvector storage, `Embedding` and `SemanticIndex` models, provider abstraction (`IEmbeddingProvider`), SHA-256 content hashing, idempotent indexing, file chunking, authenticated semantic search APIs, and frontend search interface.
- **AI Repository Understanding / RAG Foundation (Phase 7)**: Bounded RAG pipeline, prompt injection isolation, grounded source citations, persistent `Conversation` / `ConversationMessage` tracking, and interactive AI chat UI tab.
- **Architecture Discovery & Auditing (Phase 8)**: `ArchitectureAnalysis` and `ArchitectureFinding` models, cycle detection (`CIRCULAR_DEPENDENCY`), coupling metrics, boundary violation checks, pattern detection, deterministic risk scoring (0–100), and interactive Architecture Audit frontend tab.
- **System Design Studio & Interactive Diagramming (Phase 9)**: `SystemDesign`, `Diagram`, `DiagramNode`, and `DiagramEdge` models, C4 diagram generation, deterministic layout positioning, and interactive System Design Studio UI tab with SVG/JSON export.
- **Architecture Review & Governance Workflows (Phase 10)**: `ArchitectureSnapshot`, `ArchitectureDiff`, `GovernanceRule`, and `GovernanceViolation` models, snapshot diffing, rule evaluation, review status evaluation, and interactive Governance dashboard frontend tab.
- **Production Hardening (Phase 11)**: Global rate limiting, request correlation envelopes, credential sanitization, OpenTelemetry spans, readiness probes, and Docker production setup.
- **Autonomous Refactoring & Code Remediation Agents (Phase 12)**: `RemediationPlan`, `RemediationPatch`, `RemediationValidation`, and `RemediationExecution` models, remediation planner, refactoring provider abstraction (`IRefactoringProvider`), safety service, sandbox validator, executor service (Git branch + PR creation without auto-merge), RAG context integration, and frontend Remediation tab.
- **Multi-Repository Architecture Federation & Enterprise Topology Graph (Phase 13)**: `EnterpriseSystem`, `RepositoryDependency`, `EnterpriseTopologyAnalysis`, and `EnterpriseTopologyFinding` models, role inference (`FRONTEND`, `SERVICE`, `LIBRARY`, `DATABASE`, `INFRASTRUCTURE`), inter-repo dependency discovery, cross-repository cycle and SPOF audit, deterministic enterprise risk score (0-100), Redis locking (`enterprise-topology-lock:<id>`, TTL 600s), RAG context integration, and `/systems/[id]` frontend dashboard.

---

## Tech Stack

### Frontend

- **Next.js 15** (React 19, App Router)
- **TypeScript** (Strict compiler mode)
- **Tailwind CSS** (Utility styling, `darkMode: 'class'`)
- **next-themes** (Dark / Light mode with system preference support)
- **TanStack Query** (Client-side state & caching)
- **Axios** (API requests with 429/500 handling)
- **lucide-react** (Icon library)

### Backend

- **NestJS v10** (Module architecture, DI container)
- **@nestjs/throttler** (API Rate Limiting)
- **Prisma ORM** (Type-safe schemas & migrations)
- **PostgreSQL / pgvector** (Core database)
- **Winston** (Structured logging with credential sanitization)
- **Zod** (Bootstrap environments validation)
- **Swagger** (Interactive API documentation)

---

## Architecture Decision Records (ADRs)

- [ADR-001: Architecture Foundation](docs/adr/ADR-001-architecture-foundation.md)
- [ADR-003: GitHub Integration](docs/adr/ADR-003-github-integration.md)
- [ADR-004: Repository Intelligence Foundation](docs/adr/ADR-004-repository-intelligence-foundation.md)
- [ADR-005: Knowledge Graph Foundation](docs/adr/ADR-005-knowledge-graph-foundation.md)
- [ADR-006: Semantic Search Foundation](docs/adr/ADR-006-semantic-search-foundation.md)
- [ADR-007: AI Repository Understanding / RAG Foundation](docs/adr/ADR-007-ai-rag-foundation.md)
- [ADR-008: Architecture Discovery & Auditing Foundation](docs/adr/ADR-008-architecture-discovery-auditing.md)
- [ADR-009: System Design Studio & Interactive Diagramming](docs/adr/ADR-009-system-design-studio.md)
- [ADR-010: Architecture Review & Governance Workflows](docs/adr/ADR-010-architecture-governance.md)
- [ADR-011: Production Hardening & Multi-Tenant Deployment Readiness](docs/adr/ADR-011-production-hardening.md)
- [ADR-012: Autonomous Refactoring & Code Remediation Agents](docs/adr/ADR-012-autonomous-remediation-agents.md)
- [ADR-013: Multi-Repository Architecture Federation & Enterprise Topology Graph](docs/adr/ADR-013-enterprise-topology-federation.md)

---

## Development Progress

- [x] **Phase 1** — Project Foundation
- [x] **Phase 2** — Authentication & Identity
- [x] **Phase 2.5** — Platform Infrastructure
- [x] **Phase 3** — GitHub Integration & Repository Management
- [x] **Phase 4** — Repository Intelligence Foundation
- [x] **Phase 5** — Knowledge Graph Foundation
- [x] **Phase 6** — Embedding & Semantic Search
- [x] **Phase 7** — AI Repository Chat / RAG Foundation
- [x] **Phase 8** — Architecture Discovery & Auditing
- [x] **Phase 9** — System Design Studio & Interactive Diagramming
- [x] **Phase 10** — Architecture Review & Governance Workflows
- [x] **Phase 11** — Production Hardening & Multi-Tenant Deployment Readiness
- [x] **Phase 12** — Autonomous Refactoring & Code Remediation Agents
- [x] **Phase 13** — Multi-Repository Architecture Federation & Enterprise Topology Graph

---

## License

This project is licensed under the [MIT License](LICENSE).

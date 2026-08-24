# ArchitectAI

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-compose-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

ArchitectAI is an AI-powered Engineering Intelligence & System Design Platform. It digests git repositories, database schemas, and service interaction flows to construct comprehensive architecture insights, system design diagrams, automated design audits, and governance policy reviews.

---

## Vision

ArchitectAI aims to bridge the gap between abstract software architecture and actual repository implementations. By modeling the codebase as a system design knowledge graph, semantic vector index, grounded AI assistant, C4 diagram studio, and governance review engine, it provides engineers with:

1. **Automated Discovery**: Up-to-date visualization of system topologies, components, and service networks.
2. **Semantic Search & Intelligence**: Vector similarity search over codebases with contextual snippet chunking and ownership security.
3. **Grounded AI Repository Assistant**: Natural-language repository Q&A powered by RAG context combining vector search, knowledge graph relationships, architecture findings, C4 diagrams, and governance review diffs.
4. **Automated Architecture Auditing**: Deterministic cycle detection, coupling metrics, boundary violation checks, pattern detection, and structural risk scoring.
5. **Interactive System Design Studio**: Automated generation of C4 System Context, Container, and Component diagrams with interactive canvas editing and SVG/JSON export.
6. **Architecture Review & Governance Workflows**: Automated snapshot comparisons over releases, component & dependency diffs, risk score deltas, governance policy enforcement, and review status evaluation (`PASS`, `PASS_WITH_WARNINGS`, `FAILED`).
7. **Production Hardening & Deployment Readiness**: API rate limiting, multi-tenant IDOR protection, request correlation tracing, credential sanitization, OpenTelemetry observability, health probes, and Docker production manifests.

---

## Current Status

**Active Version**: `v0.1.9-production-hardening`  
The project has completed **Phases 1 through 11**. The system features a production-ready platform foundation:

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
- **OpenTelemetry Observability (Phase 11)**: `TelemetryService` instrumenting spans (`repository.sync`, `graph.build`, `semantic.index`, `semantic.search`, `ai.rag`, `architecture.analyze`, `system_design.generate`, `governance.review`) without exposing source code contents.
- **Production Docker Setup**: `docker-compose.prod.yml` with healthchecks, persistent volumes, restart policies, and graceful shutdown hooks.

---

## Architecture Overview

ArchitectAI adopts a **Modular Monolith** pattern inside a monorepo workspace:

```mermaid
graph TD
    subgraph Frontend ["Next.js App Router"]
        UI["React 19 Pages"]
        Axios["Axios client (429/500 Handling)"]
        Theme["next-themes (Dark/Light)"]
        TreeUI["RepositoryTree Component"]
        GraphUI["Knowledge Graph Inspector"]
        SearchUI["Semantic Search Bar & Results"]
        AIChatUI["AI Assistant Chat & Sources"]
        ArchUI["Architecture Audit UI"]
        SysDesignUI["System Design Studio UI"]
        GovUI["Governance Review Dashboard"]

        UI --> Axios
        UI --> Theme
        UI --> TreeUI
        UI --> GraphUI
        UI --> SearchUI
        UI --> AIChatUI
        UI --> ArchUI
        UI --> SysDesignUI
        UI --> GovUI
    end

    subgraph Backend ["NestJS v10 API"]
        App["App Module"]
        Helmet["Helmet / Security Headers"]
        Throttler["ThrottlerGuard (Rate Limit 429)"]
        ExceptionFilter["AllExceptionsFilter (Standard Envelope + X-Request-ID)"]
        Health["Health Module (/health/live, /health/ready)"]
        Telemetry["TelemetryService (OpenTelemetry Spans)"]
        RedisLock["RedisLockService"]

        App --> Helmet
        App --> Throttler
        App --> ExceptionFilter
        App --> Health
        App --> Telemetry
        App --> RedisLock
    end

    subgraph Persistence ["Infra Containers"]
        Postgres[("PostgreSQL / pgvector (GraphNode, Embedding, ArchitectureFinding, SystemDesign, ArchitectureSnapshot, ArchitectureDiff, GovernanceViolation)")]
        Redis[("Redis (Sync, Graph, Embedding, AI, Architecture, System Design, Governance Locks EX 600 NX)")]
    end

    Axios -->|REST API HTTP (X-Request-ID)| App
```

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

---

## License

This project is licensed under the [MIT License](LICENSE).

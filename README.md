# ArchitectAI — Multi-Repository Engineering Intelligence & System Design Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Version](https://img.shields.io/badge/version-1.0.0-indigo.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-0.5.0-teal.svg)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-7.0-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-compose-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**ArchitectAI** is an enterprise-grade Multi-Repository Engineering Intelligence, Interactive C4 System Design Studio, and Autonomous Code Remediation Platform. It analyzes source code trees, Abstract Syntax Trees (ASTs), inter-service dependencies, and repository metadata to build comprehensive structural knowledge graphs, high-dimensional vector embeddings, automated architectural risk audits, declarative governance policy reviews, interactive C4 architecture diagrams, and grounded AI assistant chat.

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [End-to-End Intelligence Pipeline](#end-to-end-intelligence-pipeline)
3. [Core Technical Subsystems](#core-technical-subsystems)
   - [1. Authentication & Security Foundation](#1-authentication--security-foundation)
   - [2. GitHub Integration & Tree Synchronization](#2-github-integration--tree-synchronization)
   - [3. AST Knowledge Graph Engine](#3-ast-knowledge-graph-engine)
   - [4. Semantic Search & Vector Embeddings (pgvector)](#4-semantic-search--vector-embeddings-pgvector)
   - [5. Grounded AI Repository Assistant (RAG)](#5-grounded-ai-repository-assistant-rag)
   - [6. Architecture Discovery, Smell Audit & Risk Scoring](#6-architecture-discovery-smell-audit--risk-scoring)
   - [7. Interactive C4 System Design Studio](#7-interactive-c4-system-design-studio)
   - [8. Architecture Review & Governance Engine](#8-architecture-review--governance-engine)
   - [9. Autonomous Refactoring & Code Remediation](#9-autonomous-refactoring--code-remediation)
   - [10. Enterprise Multi-Repository Topology Federation](#10-enterprise-multi-repository-topology-federation)
   - [11. Platform Infrastructure & Observability](#11-platform-infrastructure--observability)
4. [Data Model & Database Schema](#data-model--database-schema)
5. [REST API Reference](#rest-api-reference)
6. [Monorepo Structure](#monorepo-structure)
7. [Getting Started & Local Development](#getting-started--local-development)
8. [Testing & Quality Assurance](#testing--quality-assurance)
9. [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
10. [License](#license)

---

## Architectural Overview

ArchitectAI operates as a modular monorepo dividing responsibilities into a reactive Next.js 15 frontend, a high-throughput NestJS v10 backend API, a PostgreSQL database augmented with `pgvector`, and a Redis instance for concurrency locking and session management.

```mermaid
graph TD
    User["Software Engineer / Architect"] -->|HTTPS / Next.js 15| UI["ArchitectAI Web UI (Port 3000)"]
    UI -->|REST API / Axios Bearer Auth| API["NestJS API Gateway (Port 3001)"]

    subgraph Backend_Services ["ArchitectAI Core Backend Services"]
        API --> Auth["Auth & Session Guard (Argon2id + JWT)"]
        API --> GH["GitHub VCS Client (AES-256 Encryption)"]
        API --> KG["Knowledge Graph Builder"]
        API --> SS["Semantic Search (pgvector)"]
        API --> RAG["Grounded AI RAG Assistant"]
        API --> AUDIT["Architecture Audit & Risk Engine"]
        API --> C4["C4 System Design Engine"]
        API --> GOV["Governance & Policy Review Engine"]
        API --> REM["Autonomous Remediation Agent"]
        API --> TOPO["Enterprise Topology Federation"]
    end

    subgraph Storage_Layer ["Data & State Layer"]
        KG -->|Relational Graph Nodes & Edges| DB[(PostgreSQL 15)]
        SS -->|HNSW 1536-dim Embeddings| DB
        AUDIT -->|Findings & Snapshots| DB
        C4 -->|Diagram Layouts & Nodes| DB
        GOV -->|Snapshots, Diffs & Rules| DB
        REM -->|Plans, Patches & Validations| DB
        TOPO -->|System Dependencies & Federation| DB
        API -->|Distributed Locks & TTL Expirations| REDIS[(Redis Cache & Locks)]
    end

    GH -->|HTTPS REST| GitHubAPI["GitHub API (External VCS)"]
```

---

## End-to-End Intelligence Pipeline

When a repository is connected to ArchitectAI, it progresses through an automated pipeline:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Engineer
    participant UI as Next.js Frontend
    participant API as NestJS API
    participant GH as GitHub Service
    participant KG as Knowledge Graph
    participant SS as Semantic Search
    participant AUDIT as Audit Engine
    participant C4 as System Design
    participant GOV as Governance
    participant DB as PostgreSQL + pgvector

    Dev->>UI: Connect GitHub Repository
    UI->>API: POST /repositories/:id/sync
    API->>GH: Ingest Git Tree via REST API
    GH->>DB: Upsert RepositoryFile tree (filesDiscovered, paths)

    API->>KG: POST /repositories/:id/graph/build
    KG->>DB: Extract AST entities & construct GraphNode / GraphEdge

    API->>SS: POST /repositories/:id/semantic-index
    SS->>DB: Chunk code, compute vectors, upsert Embedding rows

    API->>AUDIT: POST /repositories/:id/architecture/analyze
    AUDIT->>DB: Compute coupling, cycles, and ArchitectureFinding

    API->>C4: POST /repositories/:id/system-design/generate
    C4->>DB: Generate C4 Context, Container & Component diagrams

    API->>GOV: POST /repositories/:id/governance/review
    GOV->>DB: Create ArchitectureSnapshot, diff, and evaluate rules

    API-->>UI: Complete Repository Intelligence Available
```

---

## Core Technical Subsystems

### 1. Authentication & Security Foundation

- **Password Hashing**: OWASP-aligned `Argon2id` implementation with unique salts.
- **Token Architecture**: Short-lived (15-minute) in-memory JSON Web Tokens (`JWT`) paired with 7-day rotated `HttpOnly`, `SameSite=Lax` refresh cookies.
- **Session Auditing**: Active sessions tracked in PostgreSQL (`Session` model) with IP, User-Agent, and last active timestamps.
- **Authorization**: Role-Based Access Control (`RolesGuard`, `@Roles()`) supporting `USER`, `ADMIN`, and `SERVICE` principals.
- **IDOR Protection**: Repository ownership verification on every mutation via `verifyRepositoryOwnership()`.

### 2. GitHub Integration & Tree Synchronization

- **OAuth2 Flow**: Secure GitHub OAuth web application handshake with state verification.
- **Credential Storage**: GitHub Access Tokens stored using **AES-256-GCM** encryption (`crypto` module) with initialization vectors and authenticated tags.
- **Tree Ingestion Engine**: `GithubClientService` recursively fetches repository trees, parses POSIX paths (`name`, `extension`, `parentPath`), and executes bulk upsert transactions into `RepositoryFile`.
- **Sync Tracking**: Synchronizations tracked via `RepositorySync` records (`PENDING`, `RUNNING`, `SUCCESS`, `FAILED`) with discovery and error telemetry.

### 3. AST Knowledge Graph Engine

- **Graph Topology Models**: PostgreSQL relational graph modeling via `GraphNode` and `GraphEdge` tables.
- **Node Classification**: `NodeType` supports `REPOSITORY`, `DIRECTORY`, `FILE`, `MODULE`, `CLASS`, `INTERFACE`, `FUNCTION`, `SERVICE`, `DATABASE`, and `EXTERNAL_SYSTEM`.
- **Edge Semantics**: `EdgeType` supports `CONTAINS`, `IMPORTS`, `DEPENDS_ON`, `CALLS`, `DEFINES`, `READS`, `WRITES`, `IMPLEMENTS`, and `EXTENDS`.
- **Neighborhood Traversal**: Subgraph extraction API (`/graph/neighborhood/:nodeId`) providing targeted depth-1 and depth-2 entity exploration.

### 4. Semantic Search & Vector Embeddings (pgvector)

- **Vector Database**: Native PostgreSQL `pgvector` extension utilizing Cosine Distance (`vector <=> query_vector`).
- **Chunking Strategy**: Configurable token chunking (`EMBEDDING_CHUNK_SIZE=1000`, `EMBEDDING_CHUNK_OVERLAP=200`) with SHA-256 hash checking for differential re-indexing.
- **Provider Abstraction**: `IEmbeddingProvider` interface supporting OpenAI `text-embedding-3-small` (1536 dimensions) and deterministic mock providers for testing environments.
- **Search Scoring**: Weighted similarity scoring combining vector distance and file relevance.

### 5. Grounded AI Repository Assistant (RAG)

- **Multi-Context Retrieval**:
  - Semantic vector snippets from `pgvector`
  - Structural Knowledge Graph nodes and edges
  - Architectural smells and coupling findings
  - C4 System Design component relationships
  - Governance review diffs and violation history
  - Enterprise multi-repository topology context
- **Citation Grounding**: Extracted answers provide clickable file path citations (`sources: [{ path, startLine, endLine }]`).
- **Prompt Injection Isolation**: User inputs are encapsulated in boundary delimiters to prevent prompt tampering.
- **Conversation State**: Persistent thread tracking via `Conversation` and `ChatMessage` entities.

### 6. Architecture Discovery, Smell Audit & Risk Scoring

- **Cycle Detection**: Graph traversal detecting circular dependencies (`CIRCULAR_DEPENDENCY`).
- **Coupling Metrics**: Afferent (Ca) and Efferent (Ce) coupling calculations identifying unstable bottlenecks (`HIGH_COUPLING`).
- **Boundary Violation Checks**: Detects layers bypassing intermediary services (`BOUNDARY_VIOLATION`).
- **Pattern Recognition**: Identifies Layered, Hexagonal, Event-Driven, Microservice, and Modular Monolith topologies.
- **Deterministic Risk Scoring**: 0–100 composite risk score categorized into `LOW`, `MODERATE`, `ELEVATED`, `HIGH`, and `CRITICAL`.

### 7. Interactive C4 System Design Studio

- **C4 Model Hierarchy**:
  1. **System Context**: Global overview of users, internal platforms, and external third-party systems.
  2. **Containers**: Decomposes the platform into Web UI, API Services, PostgreSQL Database, and Redis caches.
  3. **Components**: Dynamically discovers domain services, APIs, controllers, modules, and data layers with cross-component dependency edges.
- **Deterministic Layout Engine**: Grid and force-directed positioning calculation (`DiagramLayoutService`).
- **Interactive Canvas UI**: SVG rendering with dynamic auto-fit `viewBox` extents, zoom in/out/fit controls, drag-and-drop node adjustments, and SVG/JSON export.

### 8. Architecture Review & Governance Engine

- **Immutable Snapshots**: Captures point-in-time architecture states (`ArchitectureSnapshot`) containing node counts, edges, components, findings, and risk metrics.
- **Structural Diffing**: `ArchitectureDiffService` performs differential analysis across snapshots (added/removed components, dependency changes, risk deltas).
- **Rule Enforcement**: Declarative policy rules (`GovernanceRule`) evaluated against snapshots:
  - Max Permitted Risk Score
  - Prohibited Circular Dependencies
  - Forbidden Cross-Layer Dependencies
- **Compliance Status**: Evaluates review results into `PASS`, `PASS_WITH_WARNINGS`, or `FAILED`.

### 9. Autonomous Refactoring & Code Remediation

- **Remediation Planner**: Categorizes findings into `AUTO_REMEDIABLE`, `ASSISTED_REMEDIATION`, and `MANUAL_ONLY`.
- **Patch Synthesis**: Generates safe unified diff patches addressing circular imports, loose coupling, and interface extraction.
- **Safety Verification**:
  - Path traversal validation (`..` sequence filtering)
  - Protected file protection (`.env`, `.git/`, lockfiles)
  - Command allowlist verification
- **Sandbox Validator**: Executes pre-flight validations (syntax check, typecheck, unit test suites).
- **Human Approval Boundary**: Creates isolated Git branch and opens GitHub Pull Request; **never automatically merges** without engineer review.

### 10. Enterprise Multi-Repository Topology Federation

- **Enterprise Systems**: Aggregates distributed repositories into unified enterprise systems (`EnterpriseSystem`).
- **Inter-Repository Dependencies**: Discovers cross-repository relationships (`IMPORTS`, `HTTP_CALL`, `API_DEPENDENCY`, `SHARED_LIBRARY`) with confidence ratings (`HIGH`, `MEDIUM`, `LOW`).
- **Cross-Repo Smell Audits**:
  - `CIRCULAR_SERVICE_DEPENDENCY`: Cross-repository microservice cycles.
  - `SINGLE_POINT_OF_FAILURE`: Critical shared services with excessive dependents.
  - `SHARED_LIBRARY_HOTSPOT`: High-frequency upstream shared library changes.
- **Enterprise Risk Score**: Deterministic 0–100 composite enterprise risk calculation.

### 11. Platform Infrastructure & Observability

- **Redis Concurrency Locks**: Distributed mutex locking (`RedisLockService`) utilizing `SET key val EX 600 NX` protecting async pipelines against duplicate runs.
- **API Throttling**: Configurable rate limits (`RATE_LIMIT_TTL=60`, `RATE_LIMIT_LIMIT=100`) returning HTTP 429 envelopes.
- **Request Tracing**: `X-Request-ID` propagated through `AsyncLocalStorage`, logs, and response headers.
- **Structured Winston Logging**: Automatic sanitization of bearer tokens, passwords, and secrets.
- **Health Probes**: Liveness (`/api/v1/health/live`) and readiness (`/api/v1/health/ready`) probes verifying PostgreSQL, pgvector, and Redis status.

---

## Data Model & Database Schema

ArchitectAI uses PostgreSQL with Prisma ORM. Key entity relationships:

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o| GitHubAccount : links
    User ||--o{ RepositoryConnection : owns
    Repository ||--o{ RepositoryConnection : connects
    Repository ||--o{ RepositoryFile : contains
    Repository ||--o{ RepositorySync : logs
    Repository ||--o{ GraphNode : has
    Repository ||--o{ GraphEdge : has
    Repository ||--o{ Embedding : stores
    Repository ||--o{ ArchitectureAnalysis : undergoes
    ArchitectureAnalysis ||--o{ ArchitectureFinding : produces
    Repository ||--o{ SystemDesign : generates
    SystemDesign ||--o{ Diagram : contains
    Diagram ||--o{ DiagramNode : renders
    Diagram ||--o{ DiagramEdge : renders
    Repository ||--o{ ArchitectureSnapshot : versions
    ArchitectureSnapshot ||--o{ GovernanceViolation : records
    Repository ||--o{ RemediationPlan : initiates
    RemediationPlan ||--o{ RemediationPatch : includes
    EnterpriseSystem ||--o{ Repository : federates
    EnterpriseSystem ||--o{ RepositoryDependency : maps
```

---

## REST API Reference

All API routes are prefixed with `/api/v1` and documented via Swagger at `http://localhost:3001/api/docs`.

### Authentication & Users

| Method | Endpoint           | Description                                  |
| ------ | ------------------ | -------------------------------------------- |
| `POST` | `/auth/register`   | Register new user account                    |
| `POST` | `/auth/login`      | Authenticate and obtain JWT + refresh cookie |
| `POST` | `/auth/refresh`    | Rotate access token using refresh cookie     |
| `POST` | `/auth/logout`     | Invalidate active user session               |
| `GET`  | `/users/me`        | Fetch authenticated user profile             |
| `GET`  | `/users/dashboard` | Fetch aggregated dashboard statistics        |

### GitHub Integration

| Method   | Endpoint           | Description                                    |
| -------- | ------------------ | ---------------------------------------------- |
| `GET`    | `/github/connect`  | Initiate GitHub OAuth authorization URL        |
| `GET`    | `/github/callback` | Exchange OAuth code for encrypted access token |
| `GET`    | `/github/account`  | Get linked GitHub account status               |
| `DELETE` | `/github/account`  | Unlink GitHub account                          |

### Repository Management & Synchronization

| Method   | Endpoint                    | Description                                     |
| -------- | --------------------------- | ----------------------------------------------- |
| `GET`    | `/repositories`             | List connected repositories                     |
| `GET`    | `/repositories/github`      | List available repositories from GitHub account |
| `POST`   | `/repositories/:id/connect` | Connect a GitHub repository to workspace        |
| `DELETE` | `/repositories/:id/connect` | Disconnect repository                           |
| `GET`    | `/repositories/:id`         | Fetch repository detail and sync metadata       |
| `POST`   | `/repositories/:id/sync`    | Trigger live repository file tree sync          |
| `GET`    | `/repositories/:id/tree`    | Fetch parsed hierarchical file tree             |
| `GET`    | `/repositories/:id/syncs`   | List repository sync history                    |

### Knowledge Graph & Semantic Search

| Method | Endpoint                                       | Description                                     |
| ------ | ---------------------------------------------- | ----------------------------------------------- |
| `POST` | `/repositories/:id/graph/build`                | Construct AST Knowledge Graph nodes and edges   |
| `GET`  | `/repositories/:id/graph`                      | Fetch graph summary metrics                     |
| `GET`  | `/repositories/:id/graph/nodes`                | List paginated graph nodes                      |
| `GET`  | `/repositories/:id/graph/edges`                | List graph dependency edges                     |
| `GET`  | `/repositories/:id/graph/neighborhood/:nodeId` | Fetch subgraph neighborhood for a specific node |
| `POST` | `/repositories/:id/semantic-index`             | Generate pgvector embeddings for code files     |
| `GET`  | `/repositories/:id/semantic-index`             | Fetch semantic indexing status                  |
| `GET`  | `/repositories/:id/search?q=query`             | Perform vector cosine similarity search         |

### AI Assistant (RAG)

| Method   | Endpoint                                     | Description                                          |
| -------- | -------------------------------------------- | ---------------------------------------------------- |
| `POST`   | `/repositories/:id/ai/chat`                  | Send grounded natural language query to AI assistant |
| `GET`    | `/repositories/:id/ai/conversations`         | List conversation threads                            |
| `GET`    | `/repositories/:id/ai/conversations/:convId` | Get message history for a conversation               |
| `DELETE` | `/repositories/:id/ai/conversations/:convId` | Delete conversation thread                           |

### Architecture Audit & C4 System Design

| Method  | Endpoint                                                     | Description                                         |
| ------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `POST`  | `/repositories/:id/architecture/analyze`                     | Execute architecture smell and risk analysis        |
| `GET`   | `/repositories/:id/architecture`                             | Get latest architecture analysis summary            |
| `GET`   | `/repositories/:id/architecture/findings`                    | List detected architectural findings                |
| `GET`   | `/repositories/:id/architecture/components`                  | List discovered architectural components            |
| `POST`  | `/repositories/:id/system-design/generate`                   | Generate C4 Context, Container & Component diagrams |
| `GET`   | `/repositories/:id/system-design`                            | Get system design metadata                          |
| `GET`   | `/repositories/:id/system-design/diagrams`                   | List generated C4 diagrams with nodes & edges       |
| `PATCH` | `/repositories/:id/system-design/diagrams/:dId/nodes/:nId`   | Update node layout position                         |
| `POST`  | `/repositories/:id/system-design/diagrams/:dId/reset-layout` | Reset diagram to deterministic layout               |

### Governance & Autonomous Remediation

| Method | Endpoint                                       | Description                                    |
| ------ | ---------------------------------------------- | ---------------------------------------------- |
| `POST` | `/repositories/:id/governance/review`          | Run snapshot review and evaluate policies      |
| `GET`  | `/repositories/:id/governance`                 | Fetch governance review status and latest diff |
| `GET`  | `/repositories/:id/governance/snapshots`       | List versioned architecture snapshots          |
| `GET`  | `/repositories/:id/governance/violations`      | List active policy violations                  |
| `GET`  | `/repositories/:id/governance/rules`           | List configured governance rules               |
| `POST` | `/repositories/:id/governance/rules`           | Create new governance compliance rule          |
| `GET`  | `/repositories/:id/remediations`               | List autonomous remediation plans              |
| `POST` | `/repositories/:id/remediations`               | Propose remediation plan for an audit finding  |
| `POST` | `/repositories/:id/remediations/:rId/generate` | Synthesize refactoring unified patch           |
| `POST` | `/repositories/:id/remediations/:rId/validate` | Execute sandbox validation on patch            |
| `POST` | `/repositories/:id/remediations/:rId/execute`  | Create Git branch and open GitHub Pull Request |

### Enterprise Topology

| Method | Endpoint                             | Description                                     |
| ------ | ------------------------------------ | ----------------------------------------------- |
| `GET`  | `/systems`                           | List enterprise systems                         |
| `POST` | `/systems`                           | Create new enterprise system                    |
| `GET`  | `/systems/:id`                       | Get enterprise system details                   |
| `POST` | `/systems/:id/repositories/:repoId`  | Assign repository to enterprise system          |
| `POST` | `/systems/:id/topology/analyze`      | Execute multi-repository federation analysis    |
| `GET`  | `/systems/:id/topology`              | Fetch enterprise topology overview & risk score |
| `GET`  | `/systems/:id/topology/dependencies` | List discovered inter-repository dependencies   |
| `GET`  | `/systems/:id/topology/findings`     | List cross-repository architectural findings    |

---

## Monorepo Structure

```
ArchitectAI/
├── backend/                             # NestJS API Backend
│   ├── src/
│   │   ├── common/                      # Interceptors, Filters, Guards, Redis & Config
│   │   ├── modules/
│   │   │   ├── ai/                      # RAG pipeline, Context Retriever, LLM providers
│   │   │   ├── architecture/            # Smell detector, cycle finder, risk calculator
│   │   │   ├── auth/                    # Argon2id, JWT, Session management
│   │   │   ├── github/                  # OAuth2, encrypted tokens, tree ingest
│   │   │   ├── governance/              # Snapshots, diffs, rule enforcement
│   │   │   ├── health/                  # Liveness and readiness health probes
│   │   │   ├── knowledge-graph/         # Graph nodes, edges, neighborhood traversal
│   │   │   ├── platform/                # Rate limiting, tracing, security guards
│   │   │   ├── remediation/             # Patch generator, sandbox validator, PR executor
│   │   │   ├── repository/              # Repository sync, file tree queries
│   │   │   ├── semantic-search/         # pgvector embeddings, cosine similarity
│   │   │   ├── system-design/           # C4 diagram generator, layout algorithms
│   │   │   ├── topology/                # Enterprise multi-repo federation
│   │   │   └── users/                   # User profiles & dashboard aggregations
│   │   └── prisma/                      # Schema definition, migrations, and seeds
├── frontend/                            # Next.js 15 App Router Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/                  # Login & Register views
│   │   │   ├── (protected)/             # Dashboard, Settings, Repositories, Systems
│   │   │   └── github/callback/         # GitHub OAuth callback handler
│   │   ├── components/
│   │   │   ├── ai/                      # AI Chat UI & source citation cards
│   │   │   ├── architecture/            # Risk score, findings table, component lists
│   │   │   ├── github/                  # GitHub account connector
│   │   │   ├── governance/              # Diff viewers, snapshot cards, rule managers
│   │   │   ├── knowledge-graph/         # Node lists, edge lists, neighborhood view
│   │   │   ├── layout/                  # Navigation header, sidebar, theme toggles
│   │   │   ├── remediation/             # Plan cards, diff viewer, validation badges
│   │   │   ├── repository/              # Repository tree, sync status badges
│   │   │   ├── semantic-search/         # Vector search input & ranked results
│   │   │   ├── system-design/           # C4 diagram canvas, SVG nodes, toolbars
│   │   │   └── topology/                # Enterprise topology graph & dependency cards
│   │   └── services/                    # Axios API client with automatic auth headers
├── packages/
│   └── shared/                          # Universal types, DTOs, and constants
├── docs/                                # Architectural Decision Records (ADRs) & Specs
└── docker-compose.yml                   # PostgreSQL (pgvector) and Redis service definition
```

---

## Getting Started & Local Development

### Prerequisites

- **Node.js** >= 20.x
- **pnpm** >= 9.x
- **Docker & Docker Compose** (for PostgreSQL + pgvector and Redis)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/TROJAN1HAMMER/ArchitectureAI.git
cd ArchitectureAI
pnpm install
```

### 2. Configure Environment Variables

Create `.env` in `backend/` and `frontend/`:

**`backend/.env`**:

```ini
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/architectai?schema=public"
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET="super_secret_jwt_key_at_least_32_characters_long_12345"
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_URL="http://localhost:3000"
CORS_ALLOWED_ORIGINS="http://localhost:3000"
LOG_LEVEL=debug
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
MAX_REQUEST_BODY_SIZE=10mb

# GitHub OAuth App
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GITHUB_CALLBACK_URL="http://localhost:3000/github/callback"
GITHUB_OAUTH_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef" # exactly 32 chars

# AI & Embedding Providers
EMBEDDING_PROVIDER=mock # or "openai"
EMBEDDING_MODEL=text-embedding-3-small
LLM_PROVIDER=mock       # or "openai" / "anthropic"
```

**`frontend/.env.local`**:

```ini
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Start Database & Redis Services

```bash
docker compose up -d
```

### 4. Run Prisma Migrations & Seed Default Data

```bash
cd backend
pnpm prisma migrate dev
pnpm prisma db seed
cd ..
```

### 5. Build Shared Library & Start Development Servers

```bash
pnpm --filter @architect-ai/shared build
pnpm dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API Gateway**: `http://localhost:3001`
- **Swagger Interactive API Docs**: `http://localhost:3001/api/docs`

---

## Testing & Quality Assurance

ArchitectAI includes an automated test suite spanning unit tests, service specifications, controller tests, security audits, and full end-to-end integration workflows.

### Run Unit & Integration Tests

```bash
pnpm --filter backend test
```

### Run TypeScript Validation

```bash
pnpm typecheck
```

### Build for Production

```bash
pnpm build
```

---

## Architecture Decision Records (ADRs)

Detailed architectural justifications and design tradeoffs are documented in [`docs/adr/`](docs/adr/):

- [ADR-001: Architecture Foundation & Microservices](docs/adr/ADR-001-architecture-foundation.md)
- [ADR-003: GitHub Integration & Encrypted OAuth](docs/adr/ADR-003-github-integration.md)
- [ADR-004: Repository Intelligence & File Ingestion](docs/adr/ADR-004-repository-intelligence-foundation.md)
- [ADR-005: Knowledge Graph Entity & Edge Modeling](docs/adr/ADR-005-knowledge-graph-foundation.md)
- [ADR-006: Semantic Search & pgvector Integration](docs/adr/ADR-006-semantic-search-foundation.md)
- [ADR-007: AI Repository Understanding & Grounded RAG](docs/adr/ADR-007-ai-rag-foundation.md)
- [ADR-008: Architecture Discovery & Heuristic Auditing](docs/adr/ADR-008-architecture-discovery-auditing.md)
- [ADR-009: Interactive C4 System Design Studio](docs/adr/ADR-009-system-design-studio.md)
- [ADR-010: Architecture Review & Governance Workflows](docs/adr/ADR-010-architecture-governance.md)
- [ADR-011: Platform Hardening & Security Readiness](docs/adr/ADR-011-production-hardening.md)
- [ADR-012: Autonomous Refactoring & Code Remediation](docs/adr/ADR-012-autonomous-remediation-agents.md)
- [ADR-013: Enterprise Multi-Repository Topology Federation](docs/adr/ADR-013-enterprise-topology-federation.md)

---

## License

This project is licensed under the [MIT License](LICENSE).

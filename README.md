# ArchitectAI

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-compose-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

ArchitectAI is an AI-powered Engineering Intelligence & System Design Platform. It digests git repositories, database schemas, and service interaction flows to construct comprehensive architecture insights, system design diagrams, and automated design audits.

---

## Vision

ArchitectAI aims to bridge the gap between abstract software architecture and actual repository implementations. By modeling the codebase as a system design knowledge graph, it provides engineers with:

1. **Automated Discovery**: Up-to-date visualization of system topologies, components, and service networks.
2. **Quality Auditing**: AI-powered analysis of design patterns, modular boundaries, and architectural drift.
3. **Studio Design**: Collaborative studio tools to mock and simulate changes before writing any code.

---

## Current Status

**Active Version**: `v0.1.0-foundation`  
The project is currently in **Phase 1: Project Foundation**. The monorepo workspaces, core packages, Docker configuration, database schema layers, API routing, standard exception handling, and developer experience checks are fully initialized and validated.

---

## Architecture Overview

ArchitectAI adopts a **Modular Monolith** pattern inside a monorepo workspace. The backend isolates concerns through domain modules while maintaining direct compiler references. High-level interactions are diagrammed below:

```mermaid
graph TD
    subgraph Frontend ["Next.js App Router"]
        UI["React 19 Pages"]
        Axios["Axios client"]
        UI --> Axios
    end

    subgraph Shared ["Domain Common"]
        SharedLib["@architect-ai/shared"]
    end

    subgraph Backend ["NestJS v10 API"]
        App["App Module"]
        Health["Health Module"]
        Auth["Auth Module"]
        Users["Users Module"]
        Repo["Repository Module"]
        PrismaService["Prisma Client Service"]
        LoggerService["Winston Logger Wrapper"]

        App --> Health
        App --> Auth
        App --> Users
        App --> Repo
        App --> PrismaService
        App --> LoggerService
    end

    subgraph Persistence ["Infra Containers"]
        Postgres[("PostgreSQL")]
        Redis[("Redis Cache")]
    end

    Axios -->|REST API HTTP| App
    PrismaService -->|ORM SQL| Postgres
    App -->|Cache/Queues| Redis

    UI -.->|Imports| SharedLib
    App -.->|Imports| SharedLib
```

---

## Tech Stack

### Frontend

- **Next.js 15** (React 19, App Router)
- **TypeScript** (Strict compiler mode)
- **Tailwind CSS** (Utility styling)
- **TanStack Query** (Client-side state & caching)
- **Axios** (API requests)

### Backend

- **NestJS v10** (Module architecture, DI container)
- **Prisma ORM** (Type-safe schemas & migrations)
- **PostgreSQL** (Core relational database)
- **Winston** (Structured logging custom wrapper)
- **Zod** (Bootstrap environments validation)
- **Swagger** (Interactive API documentation)

### Shared Package

- **Shared Workspace Package** (`@architect-ai/shared`): Shares DTO types, schemas, constants, and utilities between packages.

### Infrastructure & Tooling

- **Docker / Docker Compose**: Standard containers orchestration.
- **Husky / lint-staged**: Pre-commit verification.
- **Commitlint**: Conventional Git commits checking.
- **Makefile**: Developer CLI workflow shortcut directives.

---

## Monorepo Structure

```text
architect-ai/
│
├── frontend/               # Next.js client application
│   ├── src/
│   │   ├── app/            # App Router pages (/dashboard, /login, /repositories, /settings)
│   │   ├── components/     # Layout shells (Header, Sidebar)
│   │   ├── providers/      # Query client setup
│   │   └── services/       # Central Axios api client instance
│   └── tsconfig.json       # Extends root tsconfig.base.json
│
├── backend/                # NestJS API application
│   ├── prisma/             # Schema configuration and empty seed file
│   ├── src/
│   │   ├── common/         # Zod configs, Winston loggers, exception filters
│   │   ├── modules/        # Pre-registered boundaries (health, auth, users, repository)
│   │   └── main.ts         # Server bootstrap, Swagger setup, pipes configuration
│   └── tsconfig.json       # Extends root tsconfig.base.json
│
├── packages/
│   └── shared/             # Domain shared declarations (@architect-ai/shared)
│       └── src/            # Types, constants, schemas, utils
│
├── docs/
│   ├── architecture/       # System diagrams and overview documents
│   └── adr/                # Architecture Decision Records
│
├── docker-compose.yml      # Core database and caching infrastructure
├── Makefile                # Developer workflow commands
├── tsconfig.base.json      # Shared strict compiler choices
└── pnpm-workspace.yaml     # Monorepo workspaces definition
```

---

## Local Development Setup

Follow these steps to run the workspace locally:

### 1. Prerequisites

Ensure you have the following installed:

- **Node.js** v20+ or v24+
- **pnpm** v9+ (or use `npx pnpm`)
- **Docker & Docker Compose**

### 2. Set Up Environments

Copy the example environment settings files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Install Dependencies

Download and link monorepo dependencies:

```bash
pnpm install
```

### 4. Database Setup & Client Generation

Start the containers and build the Prisma client schema mappings:

```bash
make docker-up
pnpm --filter backend prisma:generate
```

---

## Docker Setup

Docker runs PostgreSQL and Redis inside a custom container bridge network (`architectai-network`):

- **PostgreSQL**: Accessible locally on port `5432` with username `architect_user` and database name `architectai_db`. Persistent storage is mapped to the named volume `postgres_data`.
- **Redis**: Accessible locally on port `6379`.

To manage containers:

```bash
make docker-up       # Starts PostgreSQL & Redis
make docker-down     # Stops containers and clears networks
```

---

## Available Commands

| Operation               | Makefile command | pnpm command     | Description                                      |
| :---------------------- | :--------------- | :--------------- | :----------------------------------------------- |
| **Start Services**      | `make dev`       | `pnpm dev`       | Runs backend & frontend concurrently in dev mode |
| **Start Backend Only**  | `make backend`   | `pnpm backend`   | Starts NestJS API with hot reload                |
| **Start Frontend Only** | `make frontend`  | `pnpm frontend`  | Starts Next.js development server                |
| **Build Everything**    | `make build`     | `pnpm build`     | Compiles shared, backend, and frontend packages  |
| **Typecheck**           | `make typecheck` | `pnpm typecheck` | Validates types across all workspace modules     |
| **Lint Check**          | `make lint`      | `pnpm lint`      | Runs ESLint analysis                             |
| **Format Files**        | -                | `pnpm format`    | Formats codebase using Prettier                  |

---

## API Documentation

The backend incorporates Swagger documentation automatically. Once the backend server is running, access the interactive API docs at:

- **Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **REST Prefix**: `/api/v1`

---

## Architecture Decision Records (ADRs)

We track foundational tech decisions using Architecture Decision Records. Refer to:

- [ADR-001: Architecture Foundation](docs/adr/ADR-001-architecture-foundation.md)

---

## Development Workflow

### Conventional Commits

We enforce Conventional Commit standards. Your commit message should follow this pattern:
`type(scope): message` (e.g. `feat(backend): implement health controller`). Valid types include: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

### Pre-commit Verification

Husky and lint-staged analyze and format staged files before allowing commits:

1. Runs `eslint --fix` on javascript/typescript files.
2. Runs `prettier --write` on source files, configurations, and markdown docs.

---

## Contributing Guidelines

Please follow the rules below when contributing to ArchitectAI:

1. **Boundaries**: Maintain modular boundaries; always share code through `@architect-ai/shared` rather than cross-importing packages.
2. **Configurations**: Validate any new environment variables by adding them to the Zod schema in `backend/src/common/config/validation.ts`.
3. **Pre-commit Checks**: Ensure your code is clean, formatted, and type-checks successfully before submitting pull requests.

---

## Development Progress

- [x] **Phase 1** — Project Foundation
- [ ] **Phase 2** — Authentication & Identity
- [ ] **Phase 3** — GitHub Integration & Repository Management
- [ ] **Phase 4** — Repository Intelligence Pipeline
- [ ] **Phase 5** — Knowledge Graph
- [ ] **Phase 6** — Embedding & Semantic Search
- [ ] **Phase 7** — AI Repository Chat
- [ ] **Phase 8** — Architecture Discovery
- [ ] **Phase 9** — System Design Studio
- [ ] **Phase 10** — Architecture Review
- [ ] **Phase 11** — Production Hardening

---

## License

This project is licensed under the [MIT License](LICENSE).

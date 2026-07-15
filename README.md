# ArchitectAI

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-compose-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

ArchitectAI is an AI-powered Engineering Intelligence & System Design Platform that provides engineers with analytical insights, repository maps, and systemic design automation.

---

## Architecture Diagram

```mermaid
graph TD
    subgraph Frontend [Next.js App Router]
        UI[React 19 Pages]
        Axios[Axios client]
        UI --> Axios
    end

    subgraph Shared [Domain Common]
        SharedLib[@architect-ai/shared]
    end

    subgraph Backend [NestJS v10 API]
        App[App Module]
        Health[Health Module]
        Auth[Auth Module]
        Users[Users Module]
        Repo[Repository Module]
        PrismaService[Prisma Client Service]
        LoggerService[Winston Logger Wrapper]

        App --> Health
        App --> Auth
        App --> Users
        App --> Repo
        App --> PrismaService
        App --> LoggerService
    end

    subgraph Persistence [Infra Containers]
        Postgres[(PostgreSQL)]
        Redis[(Redis Cache)]
    end

    Axios -->|REST API HTTP| App
    PrismaService -->|ORM SQL| Postgres
    App -->|Cache/Queues| Redis

    UI -.->|Imports| SharedLib
    App -.->|Imports| SharedLib
```

---

## Folder Structure

```text
architect-ai/
├── frontend/               # Next.js 15 Client
├── backend/                # NestJS v10 API
├── packages/
│   └── shared/             # Domain Types, Constants, Schemas
├── docs/
│   ├── architecture/       # System diagrams and summaries
│   └── adr/                # Architecture Decision Records (ADRs)
├── docker/
├── docker-compose.yml      # Core Infrastructure orchestration
├── Makefile                # Developer workflow commands
└── README.md
```

---

## Project Goals

- **Modular System Boundary**: Structured cleanly with dependency isolation, interfaces validation, and custom wrappers.
- **Scalable Engineering Intelligence**: Ready for ingestion of source code maps, database schemas, and AI generation flows.
- **Frictionless Developer Experience**: Fully set up with pre-commit formatting, commit validation, and shared project packages.

---

## Setup Instructions

### Prerequisites

- **Node.js** v20+ or v24+
- **pnpm** v9+ (or use `npx pnpm`)
- **Docker** & **Docker Compose**

### Running Infrastructure

Use the Makefile or Docker commands directly to boot the PostgreSQL and Redis containers:

```bash
make docker-up
```

### Installation

Install all package dependencies in the workspace:

```bash
pnpm install
```

### Database Migration

Generate Prisma client and run migrations:

```bash
pnpm --filter backend prisma:generate
```

---

## Development Commands

All workspace operations can be run conveniently through the `Makefile` or root scripts:

| Operation                    | Makefile command   | pnpm command     |
| :--------------------------- | :----------------- | :--------------- |
| **Start Frontend & Backend** | `make dev`         | `pnpm dev`       |
| **Start Backend Dev**        | `make backend`     | `pnpm backend`   |
| **Start Frontend Dev**       | `make frontend`    | `pnpm frontend`  |
| **Typecheck Project**        | `make typecheck`   | `pnpm typecheck` |
| **Lint Workspace**           | `make lint`        | `pnpm lint`      |
| **Format Files**             | -                  | `pnpm format`    |
| **Stop Infrastructure**      | `make docker-down` | -                |

---

## Future Roadmap

- **Phase 2**: Authentication & Git ingestion workers.
- **Phase 3**: System design modeling, schema mapping, parser engines.
- **Phase 4**: LLM-driven architecture audits.

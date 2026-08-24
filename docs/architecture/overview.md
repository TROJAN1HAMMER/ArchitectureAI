# Architecture Overview

This document describes the high-level architecture of the **ArchitectAI** platform.

## Technology Stack

The project is designed as a **Modular Monolith** using a monorepo structure managed by `pnpm` workspaces:

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, next-themes (Dark/Light), TanStack Query, Axios.
- **Backend**: NestJS, TypeScript, `@nestjs/throttler` (Rate Limiting), Prisma ORM, PostgreSQL (`pgvector`), Redis (`ioredis`), Winston (logging), Zod validation.
- **Shared**: TypeScript package (`@architect-ai/shared`) sharing DTOs, schemas, constants, and utilities.
- **Infrastructure**: Docker Compose, PostgreSQL (`pgvector`), Redis (caching, locks), OpenTelemetry telemetry.

## Architecture Layout

```text
+--------------------------------------------------------+
|                  Next.js 15 Frontend                   |
| (App Router, ThemeToggle, TreeView, GraphUI, SearchUI, |
|  AIChat, ArchAudit, SysDesignStudio, GovernanceUI,     |
|  RemediationUI, EnterpriseTopologyUI)                 |
+---------------------------+----------------------------+
                            |
                            | HTTP / REST (Axios, 429/500 Handling, X-Request-ID)
                            v
+---------------------------+----------------------------+      +--------------------------+
|                  NestJS v10 Backend                    |<---->| @architect-ai/shared     |
| (Helmet, Throttler, Filter, Telemetry, RedisLock,      |      | (Types, Schemas, Consts) |
|  Topology Planner/Auditor/Discovery/Risk Engine)       |      +--------------------------+
+-----+---------------------+----------------------+-----+
      |                     |                      |
      | Prisma ORM          | Redis Lock (EX 600)  | Octokit GitHub REST
      v                     v                      v
+-----+-----+         +-----+-----+          +-----+-----+
|PostgreSQL |         |   Redis   |          |  GitHub   |
| (pgvector)|         | (Locks)   |          | (REST API)|
+-----------+         +-----------+          +-----------+
```

## Repository Intelligence, Knowledge Graph, Auditing, RAG, C4 Diagrams, Governance, Remediation & Enterprise Topology Flow

```text
HTTP Request (X-Request-ID Header)
   ↓
Helmet Security Headers & CORS Check
   ↓
ThrottlerGuard (Rate Limiting check -> returns HTTP 429 if limit exceeded)
   ↓
JwtAuthGuard (Authentication check)
   ↓
Repository / System Connection Ownership Verification (Multi-tenant IDOR check -> returns 404/403 if not owned)
   ↓
RedisLockService (Safe token-matched lock check EX 600 NX -> returns 409 if locked)
   ↓
TelemetryService (Span Traces: repository.sync, graph.build, semantic.index, ai.rag, architecture.analyze, system_design.generate, governance.review, remediation.plan, topology.analyze)
   ↓
Service Workflows (RepositorySync, KnowledgeGraph, SemanticIndex, RAG, ArchitectureAnalysis, SystemDesign, GovernanceReview, RemediationService, TopologyAnalysisService)
   ↓
Enterprise Topology Engine (Role Inference -> Inter-Repo Discovery -> Cross-Repo Cycle/SPOF Audit -> Risk Scoring -> RAG Context Injection)
   ↓
Remediation Pipeline (Planner -> Safety -> Patch Generator -> Sandbox Validator -> Executor Git Branch + PR Creation)
   ↓
Human Approval Boundary (PR Opened -> Human Review Required -> No Auto-Merge)
   ↓
AllExceptionsFilter & LoggerService (Standard Error Envelope formatting with top-level requestId & credential masking)
   ↓
HTTP Response (X-Request-ID Header + JSON Envelope)
```

## Folder Structure

- `frontend/`: React components, views, layout, client-side hooks, AI chat, Architecture Audit, System Design Studio, Governance Dashboard, Remediation UI, and Enterprise Topology dashboard (`/systems/[id]`).
- `backend/`: Core business logic services, controllers, platform security, rate limiting, exception filters, AI/RAG services, architecture engine, system design engine, governance engine, remediation engine, enterprise topology module (`/modules/topology`), telemetry, and health probes.
- `packages/shared/`: Cross-boundary validation schemas, TypeScript interfaces, and shared constants.
- `docs/`: ADR logs, architecture design docs, release notes, and phase walkthroughs.

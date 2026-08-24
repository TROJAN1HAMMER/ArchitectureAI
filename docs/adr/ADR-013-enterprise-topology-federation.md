# ADR-013: Multi-Repository Architecture Federation & Enterprise Topology Graph

## Status

Accepted

## Context

ArchitectAI initially analyzed single repositories in isolation. Modern software engineering enterprise platforms comprise distributed microservices, shared libraries, frontend applications, and database repositories. A single-repository view lacks cross-service visibility and cannot detect enterprise architecture risks such as cross-service circular dependencies or single points of failure.

## Decision

1. **Database Schema & Models**:
   - Introduce `EnterpriseSystem`, `RepositoryDependency`, `EnterpriseTopologyAnalysis`, and `EnterpriseTopologyFinding` models, and extend `Repository` with `enterpriseSystemId` and `role`.

2. **No Graph Database Requirement**:
   - Continue utilizing PostgreSQL + Prisma as primary system of record and Redis for coordination/locking. Do not introduce Neo4j or external graph databases.

3. **Deterministic Discovery & Risk Scoring**:
   - `TopologyDiscoveryService` infers relationships and confidence levels using deterministic signals (manifests, Docker configs, GraphNode matches).
   - `TopologyRiskService` computes explainable enterprise risk scores (0–100) and factor breakdowns without reliance on external LLM calls.

4. **Redis Locking**:
   - Use `enterprise-topology-lock:<enterpriseSystemId>` (600s TTL, `EX 600 NX`) to prevent concurrent analysis runs and return HTTP 409 Conflict when locked.

5. **Human Approval Boundary Preservation**:
   - Enterprise topology findings can generate Phase 12 remediation proposals, but cross-repository code changes remain strictly behind the **Human Approval Boundary** (no automated merges or direct default branch writes).

## Consequences

### Positive

- Unified enterprise topology visibility across microservices, frontend applications, and shared libraries.
- Grounded cross-repository RAG assistant queries.
- Deterministic and explainable risk calculation.

### Negative

- Inter-repository dependencies using dynamic RPC call wrappers without explicit manifest/path references require runtime telemetry integration for 100% discovery coverage.

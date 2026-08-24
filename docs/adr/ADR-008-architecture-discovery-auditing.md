# ADR-008: Architecture Discovery & Auditing Foundation

## Status

Accepted

## Context

ArchitectAI requires automated, deterministic architectural discovery and structural risk auditing over ingested codebases. To ensure explanations remain explainable, reproducible, and offline-capable without relying on non-deterministic external LLMs for structural detection, the system needed a PostgreSQL-backed audit engine operating over existing `GraphNode` and `GraphEdge` abstractions.

## Decision

1. **Deterministic Offline Analysis**:
   - Component discovery (`ArchitectureDiscoveryService`), cycle detection via DFS/Tarjan (`ArchitectureAuditorService`), pattern detection (`ArchitecturePatternService`), and risk scoring (`ArchitectureRiskService`) run 100% deterministically offline without external AI calls.

2. **Explainable Risk Scoring Heuristic**:
   - Compute a 0–100 risk score based on weighted structural factors (boundary violations +30, circular dependencies +20, risky dependencies +15, high coupling +10, hotspots +5, oversized/orphan components +3).
   - Findings are explicitly documented as engineering signals, not absolute truth.

3. **Redis Concurrency Lock**:
   - Redis key `repository:architecture-lock:<repositoryId>` with 600s TTL (`EX 600 NX`) prevents duplicate concurrent analysis jobs. Returns HTTP 409 Conflict if locked.

4. **PostgreSQL System of Record**:
   - `ArchitectureAnalysis` and `ArchitectureFinding` models store analyses and findings idempotently using composite unique constraints.

5. **RAG Integration**:
   - `ArchitectureContextService` injects finding evidence into the Phase 7 RAG pipeline so natural-language questions cite actual audit findings.

## Consequences

### Positive

- Fully reproducible, deterministic architectural audit engine.
- Fast execution with zero LLM API cost for structural checks.
- Seamless RAG integration with grounded evidence citations.

### Negative

- Structural heuristics rely on path and edge conventions; AST-level symbol tracking remains future work.

# ADR-010: Architecture Review & Governance Workflows

## Status

Accepted

## Context

ArchitectAI requires automated architecture governance review and historical diff tracking over connected codebases to detect structural drift, track added/removed components and dependencies, calculate risk score deltas, and enforce architectural boundary rules across software releases.

## Decision

1. **Deterministic Snapshot & Diff Engine**:
   - `ArchitectureSnapshotService` and `ArchitectureDiffService` capture deterministic snapshots and compute structural diffs completely offline without external AI API calls.

2. **Rule-Based Governance Evaluation**:
   - `GovernanceRuleService` and `GovernanceEngineService` enforce rules (`NO_CIRCULAR_DEPENDENCY`, `NO_FRONTEND_TO_DATABASE`, `EXCESSIVE_COUPLING`, `RISK_SCORE_THRESHOLD`) to evaluate governance status (`PASS`, `PASS_WITH_WARNINGS`, `FAILED`).

3. **Redis Concurrency Lock**:
   - Redis key `repository:governance-lock:<repositoryId>` with 600s TTL (`EX 600 NX`) prevents duplicate concurrent review jobs. Returns HTTP 409 Conflict if locked.

4. **PostgreSQL System of Record**:
   - `ArchitectureSnapshot`, `ArchitectureSnapshotNode`, `ArchitectureSnapshotEdge`, `ArchitectureDiff`, `ArchitectureDiffItem`, `GovernanceRule`, and `GovernanceViolation` models persist governance states idempotently.

5. **RAG Integration**:
   - `GovernanceContextService` injects review context into the Phase 7 RAG assistant pipeline.

## Consequences

### Positive

- Fully reproducible, deterministic architecture review and diff engine.
- Fast execution with zero LLM API cost for governance evaluation.
- Interactive governance dashboard with violation tracking and rule toggling.

### Negative

- Governance rules operate over graph and file paths; AST-level semantic policy checking remains future work.

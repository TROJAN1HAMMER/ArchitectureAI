# ADR-009: System Design Studio & Interactive Diagramming

## Status

Accepted

## Context

ArchitectAI requires interactive, explainable system design diagrams to visualize software architectures at multiple levels of abstraction (C4 System Context, Container, Component diagrams). To guarantee diagrams remain grounded and explainable without hallucinating architecture, diagrams must be derived deterministically from existing PostgreSQL Knowledge Graph and Architecture Analysis abstractions.

## Decision

1. **Deterministic C4 Generation**:
   - `SystemDesignDiscoveryService` and `DiagramGenerationService` map existing `GraphNode` and `GraphEdge` abstractions into C4 System Context, Container, and Component diagram representations deterministically.

2. **Deterministic Layout Strategy**:
   - `DiagramLayoutService` calculates reproducible initial x/y coordinates without relying on external third-party layout APIs, while supporting user position updates in PostgreSQL.

3. **Redis Concurrency Lock**:
   - Redis key `system-design:generate-lock:<repositoryId>` with 600s TTL (`EX 600 NX`) prevents duplicate concurrent generation jobs. Returns HTTP 409 Conflict if locked.

4. **PostgreSQL System of Record**:
   - `SystemDesign`, `Diagram`, `DiagramNode`, and `DiagramEdge` models persist generated diagrams and custom layouts idempotently.

5. **RAG Integration**:
   - `SystemDesignContextService` injects C4 diagram context into the Phase 7 RAG assistant pipeline.

## Consequences

### Positive

- Fully reproducible C4 diagrams grounded in code repository evidence.
- Zero external layout API dependencies or LLM diagram hallucinations.
- Interactive canvas with SVG/JSON export capabilities.

### Negative

- Initial layout uses simplified grid/layered placement; advanced auto-routing remains future enhancement.

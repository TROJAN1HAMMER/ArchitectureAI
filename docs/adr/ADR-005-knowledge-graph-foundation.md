# ADR-005: Knowledge Graph Foundation

## Status

Accepted

## Context

ArchitectAI models software codebases to produce automated system design diagrams, quality audits, and architecture discovery. Following Phase 4 (Repository Intelligence Foundation), the system required a structured graph representation of repositories, directories, files, and their internal dependencies before introducing deep AST parsers or LLM reasoning agents.

## Decision

1. **PostgreSQL Relational Knowledge Graph (`GraphNode` and `GraphEdge`)**:
   - Persist graph nodes (`GraphNode`) and directed edges (`GraphEdge`) directly in PostgreSQL via Prisma ORM.
   - Use composite unique constraints `@@unique([repositoryId, qualifiedName])` for nodes and `@@unique([repositoryId, sourceNodeId, targetNodeId, type])` for edges to enforce idempotency.

2. **Deferral of External Graph Databases (Neo4j)**:
   - PostgreSQL remains the single source of truth for the knowledge graph.
   - External graph engines (e.g. Neo4j) or vector databases (Qdrant) will only be evaluated if query traversal requirements exceed relational index performance in later phases.

3. **Deterministic Hierarchy Construction & Lightweight Import Extraction**:
   - `RepositoryGraphBuilderService` generates deterministic node qualified names (`repository:<id>`, `directory:<id>:<path>`, `file:<id>:<path>`).
   - `CONTAINS` edges connect the repository hierarchy.
   - Lightweight heuristic import extraction parses relative imports for TypeScript, JavaScript, Python, and Java files to create `IMPORTS` and `DEPENDS_ON` edges while ignoring unresolved external packages.

4. **Redis Graph Concurrency Lock**:
   - Reuse existing `RedisService` (`repository:graph-lock:<repositoryId>`, TTL 600s, NX) to prevent duplicate concurrent graph builds.
   - Return HTTP 409 Conflict when a build request arrives while another build is active.

5. **Repository Ownership & Authorization**:
   - All knowledge graph APIs verify user ownership via `RepositoryConnection` using `JwtAuthGuard`. Non-owned repository requests return HTTP 404/403.

## Consequences

### Positive

- Unified relational storage without operational overhead of separate graph databases.
- Idempotent and deterministic graph builds.
- Complete API & UI explorer for graph nodes, edges, and node neighborhoods.
- Concurrency protection via Redis locking.

### Negative

- Multi-hop graph neighborhood queries of depth > 3 rely on recursive relational joins or depth iteration.

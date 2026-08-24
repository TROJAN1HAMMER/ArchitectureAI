# Walkthrough — Phase 9: System Design Studio & Interactive Diagramming

## Objective

Build an interactive, explainable System Design Studio capable of generating and exploring C4-style architecture diagrams (System Context, Container, Component views) derived directly from PostgreSQL Knowledge Graph nodes and Architecture Analysis findings.

## Architecture Workflow

```text
Repository -> KnowledgeGraph -> ArchitectureAnalysis -> SystemDesignDiscovery -> DiagramGeneration -> DiagramLayout -> DiagramCanvas & RAG
```

## Changes Implemented

### 1. Database Schema

- Models added: `SystemDesign`, `Diagram`, `DiagramNode`, `DiagramEdge`.
- Enums added: `DiagramType`, `DiagramNodeType`, `DiagramEdgeType`.
- Applied migration: `20260824155728_add_system_design_studio`.

### 2. Workspace Version

- Updated `APP_VERSION = "0.1.7-system-design-studio"` in `packages/shared/src/constants/index.ts`.

### 3. Backend System Design Module (`backend/src/modules/system-design`)

- `system-design-discovery.service.ts`: Identifies systems, containers, components, databases, APIs.
- `diagram-generation.service.ts`: Generates C4 System Context, Container, Component diagrams.
- `diagram-layout.service.ts`: Computes initial node positions and layout reset.
- `system-design.service.ts`: Main orchestrator with Redis lock (`system-design:generate-lock:<id>`, 600s TTL, EX NX).
- `system-design-context.service.ts`: Injects C4 context into Phase 7 RAG pipeline.
- `system-design.controller.ts`: REST controller for system design summary, generation, diagrams, node positions, reset layout.
- `system-design.module.ts`: Registered in `AppModule` and `AiModule`.

### 4. Frontend System Design Studio Interface

- Created `frontend/src/components/system-design/`:
  - `SystemDesignStudio.tsx`
  - `DiagramCanvas.tsx`
  - `DiagramToolbar.tsx`
  - `DiagramNode.tsx`
  - `DiagramEdge.tsx`
  - `DiagramLegend.tsx`
  - `DiagramNodeDetails.tsx`
  - `DiagramFilters.tsx`
  - `DiagramTypeSelector.tsx`
  - `SystemDesignOverview.tsx`
  - `SystemDesignGenerateButton.tsx`
  - `SystemDesignExportButton.tsx`
- Embedded **"System Design 📐"** tab inside `/repositories/[id]` page.

## Verification Results

- `pnpm --filter backend test` — PASS (42 test suites, 105 unit/integration tests)
- `pnpm --filter backend test -- system-design.integration.spec.ts` — PASS
- `pnpm typecheck` — PASS (0 errors across 3 workspace packages)
- `pnpm lint` — PASS (0 warnings/errors)
- `pnpm --filter backend build` — PASS
- `pnpm --filter frontend build` — PASS

## Next Recommended Phase

**Phase 10: Architecture Review & Governance Workflows** — PR/commit architecture diff comparison, design rule enforcement, architecture drift alerts, and automated review checklists.

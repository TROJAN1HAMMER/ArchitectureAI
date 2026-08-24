# Walkthrough — Phase 12: Autonomous Refactoring & Code Remediation Agents

## Objective

Build the autonomous code remediation layer allowing ArchitectAI to transform architectural findings and governance violations into validated patch proposals and pull requests under a strict Human Approval Boundary.

## Remediation Pipeline Architecture

```text
Architecture Finding / Governance Violation
        ↓
RemediationPlannerService (Classify: AUTO / ASSISTED / MANUAL, Risk Scoring)
        ↓
RemediationGeneratorService (Read Content, Content Hash SHA-256, Diff Generation)
        ↓
RemediationSafetyService (Path Traversal, Protected Files, Max Diff Caps, Prompt Injection Isolation)
        ↓
RemediationValidatorService (Stale Hash Verification, Sandbox Typecheck / Lint / Test)
        ↓
RemediationExecutorService (Check Dirty Tree, Git Branch Creation, Commit, PR Creation)
        ↓
Human Approval Boundary (PR Opened -> Human Review -> Optional Merge)
```

## Supported Remediation Strategies

- **Circular Dependency Fix**: Inverts type imports or extracts interface definitions to break import cycles.
- **Boundary Violation Fix**: Replaces direct database layer imports in UI/API modules with clean Service API abstractions.
- **High Coupling Refactor**: Extracts shared utility interfaces to reduce module fan-out metrics.
- **Large Component Refactor**: Identifies candidates for modular decomposition (`MANUAL_ONLY`).
- **Governance Violation Fix**: Aligns modules with configured governance rule policies.

## Key Changes Implemented

### 1. Database Schema & Migration (`backend/prisma/schema.prisma`)

- Added `RemediationStatus`, `RemediationType`, `RemediationRiskLevel` enums.
- Added `RemediationPlan`, `RemediationPatch`, `RemediationValidation`, `RemediationExecution` models with migration `20260824162806_add_remediation_agent_foundation`.

### 2. Shared Version

- Updated `packages/shared/src/constants/index.ts` `APP_VERSION = "0.2.0-autonomous-remediation"`.

### 3. Backend Remediation Module (`backend/src/modules/remediation`)

- `RemediationSafetyService`: Security checks, path traversal, forbidden files, diff size caps, command allowlist, prompt injection isolation.
- `RemediationPlannerService`: Finding analysis and remediation plan creation.
- `MockRefactoringProviderService`: Deterministic refactoring proposals for offline validation.
- `RemediationGeneratorService`: SHA-256 content hashing, diff generation, patch persistence.
- `RemediationValidatorService`: Stale patch detection, sandbox validation execution.
- `RemediationExecutorService`: Human approval boundary, git branch creation, PR workflow.
- `RemediationContextService`: Phase 7 RAG context enrichment.
- `RemediationService` & `RemediationController`: Workflow orchestration, ownership checks, Redis locks (`repository:remediation-lock:<repositoryId>:<remediationId>`), REST endpoints.

### 4. Frontend Remediation Tab (`frontend/src/components/remediation`)

- `RemediationOverview`, `RemediationPlanCard`, `RemediationDiffViewer`, `RemediationValidation`, `RemediationRiskBadge`, `RemediationStatusBadge`, `RemediationPRLink` integrated into `/repositories/[id]`.

## Verification Results

- `pnpm --filter backend test` — PASS (59 test suites, 148 unit/integration tests)
- `pnpm --filter backend test -- remediation.integration.spec.ts` — PASS
- `pnpm --filter backend test -- remediation-security.spec.ts` — PASS
- `pnpm typecheck` — PASS (0 errors across 3 workspace packages)
- `pnpm lint` — PASS (0 warnings/errors)
- `pnpm --filter backend build` — PASS
- `pnpm --filter frontend build` — PASS
- Database Audit — PASS (all 4 remediation tables verified)

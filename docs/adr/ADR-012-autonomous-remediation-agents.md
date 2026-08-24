# ADR-012: Autonomous Refactoring & Code Remediation Agents

## Status

Accepted

## Context

ArchitectAI identifies architectural findings, coupling hotspots, boundary violations, and governance policy failures. To reduce engineering effort in fixing structural degradation, the system requires autonomous refactoring agents capable of planning, generating, sandbox validating, and proposing pull requests for code remediation.

## Decision

1. **Human Approval Boundary**:
   - ArchitectAI enforces a strict human approval boundary. It may create branches (`architectai/remediation/...`) and open Pull Requests, but it **MUST NOT automatically merge PRs**, force push, or modify default branches directly.

2. **Database Models**:
   - `RemediationPlan`, `RemediationPatch`, `RemediationValidation`, `RemediationExecution` Prisma models track the remediation lifecycle from proposal to PR creation.

3. **Classification & Risk**:
   - `RemediationPlannerService` classifies findings into `AUTO_REMEDIABLE`, `ASSISTED_REMEDIATION`, or `MANUAL_ONLY` and assigns risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

4. **Security & Threat Isolation**:
   - `RemediationSafetyService` enforces path traversal protection, blocks modifications to protected files (`.git`, `.env`, secrets), enforces a command allowlist (`pnpm typecheck`, `pnpm lint`, `pnpm --filter backend test`), and treats repo contents strictly as UNTRUSTED DATA (prompt injection isolation).

5. **Sandbox Validation & Stale Patch Protection**:
   - `RemediationValidatorService` verifies original file content hashes match on disk before applying patches. Validations run typecheck, lint, and test commands in isolation. A plan becomes `READY` only if all validation checks pass.

6. **Concurrency & Locking**:
   - `RedisLockService` (`repository:remediation-lock:<repositoryId>:<remediationId>`, 600s TTL) prevents concurrent duplicate patch generation and execution.

## Consequences

### Positive

- Automates tedious refactoring tasks while maintaining a strict safety net.
- Guarantees zero unverified code or broken builds enter Pull Requests.
- Human engineers retain complete authority over final codebase merging.

### Negative

- Complex architectural refactorings requiring domain understanding remain `MANUAL_ONLY` or `ASSISTED_REMEDIATION`.

# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0-autonomous-remediation] - 2026-08-24

### Added

- `RemediationStatus`, `RemediationType`, and `RemediationRiskLevel` enums in Prisma schema
- `RemediationPlan`, `RemediationPatch`, `RemediationValidation`, and `RemediationExecution` models with Prisma migration `20260824162806_add_remediation_agent_foundation`
- Updated shared constant `APP_VERSION = "0.2.0-autonomous-remediation"` in `packages/shared/src/constants/index.ts`
- `RemediationPlannerService` classifying architectural findings into `AUTO_REMEDIABLE`, `ASSISTED_REMEDIATION`, or `MANUAL_ONLY` and assigning risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- Refactoring provider interface `IRefactoringProvider` and `MockRefactoringProviderService` for generating deterministic proposed file refactorings and diffs
- `RemediationGeneratorService` for reading file contents, computing original SHA-256 hashes (`originalContentHash`), generating refactoring proposals and unified diffs, and persisting `RemediationPatch` records
- `RemediationSafetyService` enforcing strict security checks: path traversal protection (`../`, `/etc/passwd`), protected file path protection (`.git/`, `.env`, `secrets.json`, `id_rsa`), patch size limits (5 files max, 100KB max diff size), command allowlist (`pnpm typecheck`, `pnpm lint`, `pnpm --filter backend test`), and prompt injection isolation
- `RemediationValidatorService` enforcing stale patch protection (verifying original file hashes match on disk), executing sandbox validations, recording `RemediationValidation` records, and updating plan status to `READY` or `FAILED`
- `RemediationExecutorService` enforcing a strict Human Approval Boundary: checking working tree cleanliness, verifying `READY` status, creating branch `architectai/remediation/<type>-<short-id>`, committing changes, pushing branch, opening GitHub Pull Request via `GithubClientService`, and attaching explicit PR disclaimer that final merge approval requires human review
- `RemediationContextService` enriching Phase 7 RAG context with proposed/validated remediation plans, risk levels, and PR URLs
- `RemediationService` orchestrating remediation workflows, multi-tenant repository connection ownership checks, and Redis concurrency locking (`repository:remediation-lock:<repositoryId>:<remediationId>`, TTL 600s, `EX 600 NX`)
- REST API endpoints under `RemediationController`:
  - `GET /api/v1/repositories/:id/remediations` (List remediation plans)
  - `POST /api/v1/repositories/:id/remediations` (Create plan from finding)
  - `GET /api/v1/repositories/:id/remediations/:remediationId` (Get plan details)
  - `POST /api/v1/repositories/:id/remediations/:remediationId/generate` (Generate patches)
  - `POST /api/v1/repositories/:id/remediations/:remediationId/validate` (Run sandbox validation)
  - `POST /api/v1/repositories/:id/remediations/:remediationId/execute` (Create branch & PR, no auto-merge)
  - `DELETE /api/v1/repositories/:id/remediations/:remediationId` (Cancel/delete plan)
- Frontend Remediation tab (`RemediationOverview`, `RemediationPlanCard`, `RemediationDiffViewer`, `RemediationValidation`, `RemediationRiskBadge`, `RemediationStatusBadge`, `RemediationPRLink`) integrated into `/repositories/[id]` page
- Unit and integration test suite (`remediation-planner.service.spec.ts`, `remediation-generator.service.spec.ts`, `remediation-safety.service.spec.ts`, `remediation-validator.service.spec.ts`, `remediation-executor.service.spec.ts`, `remediation.service.spec.ts`, `remediation.controller.spec.ts`, `remediation-security.spec.ts`, `remediation.integration.spec.ts`)

### Security

- Enforced Human Approval Boundary (no automatic merging, no force pushing, no direct default branch modification)
- Path traversal, absolute path, and symlink escape prevention
- Protected file path protection (`.git`, `.env`, secrets)
- Command allowlist validation blocking destructive patterns (`rm -rf`, `sudo`, `curl | sh`, `chmod 777`, `git reset --hard`, `git push --force`)
- Prompt injection isolation treating repository content strictly as UNTRUSTED DATA
- Multi-tenant IDOR protection and Redis concurrency locking

## [0.1.9-production-hardening] - 2026-08-24

### Added

- Production Configuration Validation Zod schema in `backend/src/common/config/validation.ts`
- `@nestjs/throttler` integration with global `ThrottlerGuard`
- Standardized `AllExceptionsFilter` error envelope with top-level `requestId`
- `LoggerService` credential sanitization
- Production Health & Readiness endpoints (`GET /health`, `GET /health/live`, `GET /health/ready`)
- `RedisLockService` in `backend/src/common/redis/redis-lock.service.ts`
- `TelemetryService` in `backend/src/common/telemetry/telemetry.service.ts`
- Production deployment configuration `docker-compose.prod.yml`

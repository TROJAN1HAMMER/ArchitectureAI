# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-08-25

### Core Platform & System Refinement

- **Full End-to-End Pipeline Integration**: Verified live synchronization, AST Knowledge Graph construction, Semantic Indexing with pgvector, C4 System Design Studio, Architecture Audit, Governance Policy Enforcement, AI Assistant RAG, and Autonomous Remediation.
- **C4 Component Diagram Discovery Engine**: Enhanced `SystemDesignDiscoveryService` with universal multi-language component discovery across repository topologies (APIs, Services, Modules, Data Layer) and automatic Knowledge Graph cross-component dependency edge mapping.
- **Responsive Workspace UI**: Eliminated page-level horizontal overflow across all viewports; introduced an internally scrollable compact tab bar with Lucide icons, category dividers, and clear active contrast states.
- **C4 Interactive Canvas & Auto-fit Viewport**: Upgraded `DiagramCanvas` with dynamic bounding-box `viewBox` calculations, floating Zoom In/Out/Fit controls, and actionable empty states.
- **Audit Findings to Remediation Bridge**: Connected discovered architectural findings directly to automated remediation plan generation with one-click proposals.
- **Governance vs Architecture Audit Distinction**: Added clear context banners distinguishing policy compliance vs structural code analysis.
- **Action Hierarchy & Loading States**: Standardized repository action button hierarchy (Primary, Secondary, Tertiary, External) with responsive wrapping and live feedback.
- **Shared Constants & Versioning**: Updated `APP_VERSION` to `1.0.0` in `@architect-ai/shared`.

## [0.2.1-enterprise-topology] - 2026-08-24

### Added

- `RepositoryRole`, `RepositoryDependencyType`, `DependencyConfidence`, `EnterpriseTopologyStatus`, `EnterpriseFindingType`, and `EnterpriseFindingSeverity` enums in Prisma schema
- `EnterpriseSystem`, `RepositoryDependency`, `EnterpriseTopologyAnalysis`, and `EnterpriseTopologyFinding` models with Prisma migration `20260824164145_add_enterprise_topology_federation`
- Extended `Repository` model with `enterpriseSystemId` and `role`
- Updated shared constant `APP_VERSION = "0.2.1-enterprise-topology"` in `packages/shared/src/constants/index.ts`
- `EnterpriseSystemService` managing system CRUD, role assignments, repository membership, and multi-tenant ownership verification
- `RepositoryDependencyService` managing inter-repository dependencies with composite uniqueness (`sourceRepositoryId`, `targetRepositoryId`, `type`)
- `TopologyDiscoveryService` inferring repository roles (`FRONTEND`, `SERVICE`, `LIBRARY`, `DATABASE`, `INFRASTRUCTURE`) and discovering inter-repository relationships (`IMPORTS`, `HTTP_CALL`, `API_DEPENDENCY`, `SHARED_LIBRARY`) with confidence levels (`HIGH`, `MEDIUM`, `LOW`) and evidence
- `TopologyAuditorService` detecting cross-repository cycles (`CIRCULAR_SERVICE_DEPENDENCY`), high coupling, single points of failure (`SINGLE_POINT_OF_FAILURE`), shared library hotspots (`SHARED_LIBRARY_HOTSPOT`), and cross-boundary violations
- `TopologyRiskService` calculating deterministic enterprise risk scores (0–100) and risk levels (`LOW`, `MODERATE`, `ELEVATED`, `HIGH`, `CRITICAL`) with factor penalty breakdowns
- `TopologyAnalysisService` orchestrating analysis runs protected by Redis locking (`enterprise-topology-lock:<enterpriseSystemId>`, 600s TTL, `EX 600 NX`) and handling idempotent execution
- `TopologyContextService` injecting enterprise system topology context into Phase 7 RAG assistant queries
- REST API endpoints under `EnterpriseTopologyController` (`/api/v1/systems`, `/api/v1/systems/:id/topology/analyze`, etc.)
- Frontend Enterprise System Dashboard page `/systems/[id]` and components (`EnterpriseSystemOverview`, `TopologyGraph`, `TopologyRiskScore`, `TopologyRepositories`, `TopologyDependencies`, `TopologyFindings`, `TopologyHistory`, `DependencyConfidenceBadge`)
- Unit and integration test suites (`enterprise-system.service.spec.ts`, `repository-dependency.service.spec.ts`, `topology-discovery.service.spec.ts`, `topology-auditor.service.spec.ts`, `topology-risk.service.spec.ts`, `topology-analysis.service.spec.ts`, `topology-context.service.spec.ts`, `enterprise-topology.controller.spec.ts`, `topology-analysis.integration.spec.ts`)

## [0.2.0-autonomous-remediation] - 2026-08-24

### Added

- `RemediationStatus`, `RemediationType`, and `RemediationRiskLevel` enums in Prisma schema
- `RemediationPlan`, `RemediationPatch`, `RemediationValidation`, and `RemediationExecution` models with Prisma migration `20260824162806_add_remediation_agent_foundation`
- Updated shared constant `APP_VERSION = "0.2.0-autonomous-remediation"` in `packages/shared/src/constants/index.ts`
- `RemediationPlannerService` classifying architectural findings into `AUTO_REMEDIABLE`, `ASSISTED_REMEDIATION`, or `MANUAL_ONLY`
- `RemediationGeneratorService` generating proposed refactorings and unified diffs
- `RemediationSafetyService` enforcing security checks (path traversal, protected files, command allowlist, prompt injection isolation)
- `RemediationValidatorService` executing sandbox validation (typecheck, lint, test)
- `RemediationExecutorService` creating Git branch & Pull Request under a strict Human Approval Boundary (no auto-merge)
- Frontend Remediation tab integrated into `/repositories/[id]` page

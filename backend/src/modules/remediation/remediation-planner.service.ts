import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RemediationSafetyService } from "./remediation-safety.service.js";
import {
  RemediationType,
  RemediationRiskLevel,
  RemediationStatus,
  ArchitectureFindingType,
} from "@prisma/client";

export interface RemediationPlanResult {
  type: RemediationType;
  classification: "AUTO_REMEDIABLE" | "ASSISTED_REMEDIATION" | "MANUAL_ONLY";
  riskLevel: RemediationRiskLevel;
  title: string;
  description: string;
  rationale: string;
  proposedChanges: any;
  affectedFiles: string[];
  validationPlan: any;
  estimatedImpact: any;
}

@Injectable()
export class RemediationPlannerService {
  private readonly logger = new Logger(RemediationPlannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly safetyService: RemediationSafetyService,
  ) {}

  async createPlanForFinding(
    userId: string,
    repositoryId: string,
    findingId: string,
  ) {
    const finding = await this.prisma.architectureFinding.findFirst({
      where: { id: findingId, repositoryId },
      include: {
        sourceNode: true,
        targetNode: true,
      },
    });

    if (!finding) {
      throw new NotFoundException(
        `Architecture finding with ID ${findingId} not found`,
      );
    }

    const planDetails = this.planRemediation(finding);

    const plan = await this.prisma.remediationPlan.create({
      data: {
        repositoryId,
        findingId: finding.id,
        userId,
        type: planDetails.type,
        status: RemediationStatus.PROPOSED,
        riskLevel: planDetails.riskLevel,
        title: planDetails.title,
        description: planDetails.description,
        rationale: planDetails.rationale,
        proposedChanges: planDetails.proposedChanges,
        affectedFiles: planDetails.affectedFiles,
        validationPlan: planDetails.validationPlan,
        estimatedImpact: planDetails.estimatedImpact,
      },
    });

    this.logger.log(
      `Created remediation plan ${plan.id} for finding ${findingId} (${plan.type})`,
    );
    return plan;
  }

  planRemediation(finding: any): RemediationPlanResult {
    const findingType = finding.type as ArchitectureFindingType;
    const sourcePath =
      finding.sourceNode?.path ||
      finding.sourceNode?.qualifiedName ||
      "unknown_source";
    const targetPath =
      finding.targetNode?.path ||
      finding.targetNode?.qualifiedName ||
      "unknown_target";

    const sanitizedTitle = this.safetyService.sanitizePromptInput(
      finding.title,
    );

    switch (findingType) {
      case ArchitectureFindingType.CIRCULAR_DEPENDENCY:
        return {
          type: RemediationType.CIRCULAR_DEPENDENCY_FIX,
          classification: "AUTO_REMEDIABLE",
          riskLevel: RemediationRiskLevel.LOW,
          title: `Fix Circular Dependency: ${sanitizedTitle}`,
          description: `Break circular dependency cycle between ${sourcePath} and ${targetPath} by extracting interface or type imports.`,
          rationale: `Direct circular dependencies cause module initialization deadlocks and tight coupling. Inverting type imports resolves the cycle deterministically without modifying runtime business logic.`,
          proposedChanges: [
            {
              file: sourcePath,
              action: "Invert type import / extract interface",
            },
            { file: targetPath, action: "Decouple export dependency" },
          ],
          affectedFiles: [sourcePath, targetPath].filter(Boolean),
          validationPlan: {
            commands: [
              "pnpm typecheck",
              "pnpm lint",
              "pnpm --filter backend test",
            ],
            checks: [
              "Verify no circular import warnings remain",
              "Verify typecheck passes",
            ],
          },
          estimatedImpact: {
            couplingScoreDelta: -15.0,
            riskScoreDelta: -20.0,
            breakingChangeRisk: "NONE",
          },
        };

      case ArchitectureFindingType.BOUNDARY_VIOLATION:
        return {
          type: RemediationType.BOUNDARY_VIOLATION_FIX,
          classification: "ASSISTED_REMEDIATION",
          riskLevel: RemediationRiskLevel.MEDIUM,
          title: `Resolve Boundary Violation: ${sanitizedTitle}`,
          description: `Replace direct boundary import from ${sourcePath} to ${targetPath} with a clean API service abstraction layer.`,
          rationale: `Lower-level modules or UI components should not bypass business logic services to access database layers directly.`,
          proposedChanges: [
            {
              file: sourcePath,
              action: "Redirect import through Service API abstraction",
            },
          ],
          affectedFiles: [sourcePath].filter(Boolean),
          validationPlan: {
            commands: [
              "pnpm typecheck",
              "pnpm lint",
              "pnpm --filter backend test",
            ],
            checks: ["Verify boundary enforcement rules pass"],
          },
          estimatedImpact: {
            couplingScoreDelta: -10.0,
            riskScoreDelta: -15.0,
            breakingChangeRisk: "LOW",
          },
        };

      case ArchitectureFindingType.HIGH_COUPLING:
        return {
          type: RemediationType.HIGH_COUPLING_REFACTOR,
          classification: "ASSISTED_REMEDIATION",
          riskLevel: RemediationRiskLevel.MEDIUM,
          title: `Decouple Highly Coupled Component: ${sanitizedTitle}`,
          description: `Extract shared utility interfaces to reduce fan-out dependency count on ${sourcePath}.`,
          rationale: `Extremely high dependency coupling leads to brittle modules and regression cascades when changes occur.`,
          proposedChanges: [
            {
              file: sourcePath,
              action: "Extract shared interface to separate utility module",
            },
          ],
          affectedFiles: [sourcePath].filter(Boolean),
          validationPlan: {
            commands: ["pnpm typecheck", "pnpm lint"],
            checks: ["Verify fan-out metric reduction"],
          },
          estimatedImpact: {
            couplingScoreDelta: -25.0,
            riskScoreDelta: -10.0,
            breakingChangeRisk: "LOW",
          },
        };

      case ArchitectureFindingType.LARGE_COMPONENT:
        return {
          type: RemediationType.LARGE_COMPONENT_REFACTOR,
          classification: "MANUAL_ONLY",
          riskLevel: RemediationRiskLevel.HIGH,
          title: `Decompose Large Component: ${sanitizedTitle}`,
          description: `Component ${sourcePath} is excessively large. Decompose into focused sub-modules.`,
          rationale: `Large components violate Single Responsibility Principle. Automated refactoring requires human domain understanding to partition correctly.`,
          proposedChanges: [
            {
              file: sourcePath,
              action: "Manual decomposition into sub-components",
            },
          ],
          affectedFiles: [sourcePath].filter(Boolean),
          validationPlan: {
            commands: ["pnpm typecheck", "pnpm --filter backend test"],
            checks: ["Verify unit test coverage post-decomposition"],
          },
          estimatedImpact: {
            couplingScoreDelta: -5.0,
            riskScoreDelta: -15.0,
            breakingChangeRisk: "MEDIUM",
          },
        };

      default:
        return {
          type: RemediationType.GOVERNANCE_VIOLATION_FIX,
          classification: "ASSISTED_REMEDIATION",
          riskLevel: RemediationRiskLevel.LOW,
          title: `Remediate Finding: ${sanitizedTitle}`,
          description: `Remediate architectural issue ${sanitizedTitle} affecting ${sourcePath}.`,
          rationale: `Resolving finding aligns codebase with architectural governance rules.`,
          proposedChanges: [
            { file: sourcePath, action: "Apply recommended architectural fix" },
          ],
          affectedFiles: [sourcePath].filter(Boolean),
          validationPlan: {
            commands: ["pnpm typecheck", "pnpm lint"],
            checks: ["Verify rule compliance"],
          },
          estimatedImpact: {
            couplingScoreDelta: -5.0,
            riskScoreDelta: -5.0,
            breakingChangeRisk: "LOW",
          },
        };
    }
  }
}

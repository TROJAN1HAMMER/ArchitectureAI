import { Injectable } from "@nestjs/common";
import { EvaluatedTopologyFinding } from "./topology-auditor.service.js";
import {
  EnterpriseFindingSeverity,
  EnterpriseFindingType,
} from "@prisma/client";

export interface RiskCalculationResult {
  riskScore: number;
  riskLevel: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  factorBreakdown: {
    circularDependenciesPenalty: number;
    couplingPenalty: number;
    singlePointOfFailurePenalty: number;
    crossBoundaryPenalty: number;
    orphanPenalty: number;
    totalFindingsCount: number;
    criticalFindingsCount: number;
    highFindingsCount: number;
  };
}

@Injectable()
export class TopologyRiskService {
  calculateRiskScore(
    findings: EvaluatedTopologyFinding[],
  ): RiskCalculationResult {
    let circularPenalty = 0;
    let couplingPenalty = 0;
    let spofPenalty = 0;
    let crossBoundaryPenalty = 0;
    let orphanPenalty = 0;

    let criticalCount = 0;
    let highCount = 0;

    for (const f of findings) {
      if (f.severity === EnterpriseFindingSeverity.CRITICAL) criticalCount++;
      if (f.severity === EnterpriseFindingSeverity.HIGH) highCount++;

      switch (f.type) {
        case EnterpriseFindingType.CIRCULAR_SERVICE_DEPENDENCY:
          circularPenalty += 20;
          break;
        case EnterpriseFindingType.SINGLE_POINT_OF_FAILURE:
          spofPenalty += 15;
          break;
        case EnterpriseFindingType.CROSS_BOUNDARY_DEPENDENCY:
          crossBoundaryPenalty += 15;
          break;
        case EnterpriseFindingType.HIGH_SERVICE_COUPLING:
        case EnterpriseFindingType.DEPENDENCY_HOTSPOT:
          couplingPenalty += 10;
          break;
        case EnterpriseFindingType.ORPHAN_REPOSITORY:
          orphanPenalty += 5;
          break;
        default:
          couplingPenalty += 5;
          break;
      }
    }

    // Cap penalties
    circularPenalty = Math.min(35, circularPenalty);
    couplingPenalty = Math.min(25, couplingPenalty);
    spofPenalty = Math.min(20, spofPenalty);
    crossBoundaryPenalty = Math.min(20, crossBoundaryPenalty);
    orphanPenalty = Math.min(10, orphanPenalty);

    const rawScore =
      circularPenalty +
      couplingPenalty +
      spofPenalty +
      crossBoundaryPenalty +
      orphanPenalty;
    const riskScore = Math.min(100, Math.round(rawScore * 10) / 10);

    let riskLevel: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL" =
      "LOW";
    if (riskScore >= 80) {
      riskLevel = "CRITICAL";
    } else if (riskScore >= 60) {
      riskLevel = "HIGH";
    } else if (riskScore >= 40) {
      riskLevel = "ELEVATED";
    } else if (riskScore >= 20) {
      riskLevel = "MODERATE";
    } else {
      riskLevel = "LOW";
    }

    return {
      riskScore,
      riskLevel,
      factorBreakdown: {
        circularDependenciesPenalty: circularPenalty,
        couplingPenalty,
        singlePointOfFailurePenalty: spofPenalty,
        crossBoundaryPenalty,
        orphanPenalty,
        totalFindingsCount: findings.length,
        criticalFindingsCount: criticalCount,
        highFindingsCount: highCount,
      },
    };
  }
}

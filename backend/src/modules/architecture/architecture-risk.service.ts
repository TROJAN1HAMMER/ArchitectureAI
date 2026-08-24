import { Injectable } from "@nestjs/common";
import {
  ArchitectureFindingSeverity,
  ArchitectureFindingType,
} from "@prisma/client";
import { DraftFinding } from "./architecture-auditor.service.js";

export type RiskLevel = "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";

export interface RiskFactor {
  findingType: string;
  count: number;
  weight: number;
  contribution: number;
}

export interface RiskAnalysisResult {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  explanation: string;
}

@Injectable()
export class ArchitectureRiskService {
  calculateRiskScore(findings: DraftFinding[]): RiskAnalysisResult {
    if (!findings || findings.length === 0) {
      return {
        score: 0,
        level: "LOW",
        factors: [],
        explanation: "No architectural risks or structural anomalies detected.",
      };
    }

    const typeCounts = new Map<string, number>();
    for (const f of findings) {
      if (f.severity !== ArchitectureFindingSeverity.INFO) {
        typeCounts.set(f.type, (typeCounts.get(f.type) || 0) + 1);
      }
    }

    const weightMap: Record<string, number> = {
      [ArchitectureFindingType.BOUNDARY_VIOLATION]: 30,
      [ArchitectureFindingType.CIRCULAR_DEPENDENCY]: 20,
      [ArchitectureFindingType.RISKY_DEPENDENCY]: 15,
      [ArchitectureFindingType.HIGH_COUPLING]: 10,
      [ArchitectureFindingType.DEPENDENCY_HOTSPOT]: 5,
      [ArchitectureFindingType.LARGE_COMPONENT]: 3,
      [ArchitectureFindingType.ORPHAN_COMPONENT]: 2,
    };

    const factors: RiskFactor[] = [];
    let totalScore = 0;

    for (const [type, count] of typeCounts.entries()) {
      const weight = weightMap[type] || 2;
      const contribution = Math.min(40, count * weight);
      totalScore += contribution;

      factors.push({
        findingType: type,
        count,
        weight,
        contribution,
      });
    }

    const score = Math.min(100, Math.max(0, Math.round(totalScore)));

    let level: RiskLevel = "LOW";
    if (score > 80) level = "CRITICAL";
    else if (score > 60) level = "HIGH";
    else if (score > 40) level = "ELEVATED";
    else if (score > 20) level = "MODERATE";

    let explanation = `ArchitectAI structural risk score of ${score}/100 (${level}). `;
    if (factors.length === 0) {
      explanation +=
        "The repository architecture is clean with minimal structural risk.";
    } else {
      const topFactor = factors.sort(
        (a, b) => b.contribution - a.contribution,
      )[0];
      explanation += `Primary risk contributor: ${topFactor.findingType.replace(/_/g, " ")} (${topFactor.count} occurrences).`;
    }

    return {
      score,
      level,
      factors,
      explanation,
    };
  }
}

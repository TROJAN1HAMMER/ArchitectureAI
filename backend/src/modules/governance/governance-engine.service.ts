import { Injectable } from "@nestjs/common";
import {
  GovernanceRule,
  GovernanceRuleSeverity,
  GovernanceViolationStatus,
} from "@prisma/client";

export interface EvaluatedViolation {
  ruleId: string;
  severity: GovernanceRuleSeverity;
  title: string;
  description: string;
  confidence: number;
  sourceNodeId?: string;
  targetNodeId?: string;
  evidence?: any;
  status: GovernanceViolationStatus;
}

@Injectable()
export class GovernanceEngineService {
  evaluateRules(
    rules: GovernanceRule[],
    analysis: any,
    _diff?: any,
  ): EvaluatedViolation[] {
    const violations: EvaluatedViolation[] = [];
    const activeRules = rules.filter((r) => r.enabled);

    const findings = analysis?.findings || [];
    const riskScore = analysis?.riskScore || 0.0;

    for (const rule of activeRules) {
      switch (rule.ruleType) {
        case "NO_CIRCULAR_DEPENDENCY": {
          const cycles = findings.filter(
            (f: any) => f.type === "CIRCULAR_DEPENDENCY",
          );
          for (const cycle of cycles) {
            violations.push({
              ruleId: rule.id,
              severity: rule.severity,
              title: `Circular Dependency Violation: ${cycle.title}`,
              description: cycle.description,
              confidence: 1.0,
              sourceNodeId: cycle.sourceNodeId,
              targetNodeId: cycle.targetNodeId,
              evidence: cycle.evidence,
              status: GovernanceViolationStatus.OPEN,
            });
          }
          break;
        }

        case "NO_FRONTEND_TO_DATABASE":
        case "NO_DATABASE_TO_FRONTEND": {
          const boundaries = findings.filter(
            (f: any) =>
              f.type === "BOUNDARY_VIOLATION" || f.type === "RISKY_DEPENDENCY",
          );
          for (const boundary of boundaries) {
            violations.push({
              ruleId: rule.id,
              severity: rule.severity,
              title: `Layer Boundary Violation: ${boundary.title}`,
              description: boundary.description,
              confidence: 1.0,
              sourceNodeId: boundary.sourceNodeId,
              targetNodeId: boundary.targetNodeId,
              evidence: boundary.evidence,
              status: GovernanceViolationStatus.OPEN,
            });
          }
          break;
        }

        case "EXCESSIVE_COUPLING": {
          const couplingFindings = findings.filter(
            (f: any) =>
              f.type === "HIGH_COUPLING" || f.type === "DEPENDENCY_HOTSPOT",
          );
          for (const c of couplingFindings) {
            violations.push({
              ruleId: rule.id,
              severity: rule.severity,
              title: `Excessive Coupling Violation: ${c.title}`,
              description: c.description,
              confidence: 1.0,
              sourceNodeId: c.sourceNodeId,
              evidence: c.evidence,
              status: GovernanceViolationStatus.OPEN,
            });
          }
          break;
        }

        case "RISK_SCORE_THRESHOLD": {
          const maxAllowed = (rule.configuration as any)?.maxRiskScore || 60;
          if (riskScore > maxAllowed) {
            violations.push({
              ruleId: rule.id,
              severity: rule.severity,
              title: `Architecture Risk Threshold Exceeded (${riskScore.toFixed(1)} > ${maxAllowed})`,
              description: `Repository risk score of ${riskScore.toFixed(1)} exceeds maximum governance limit of ${maxAllowed}.`,
              confidence: 1.0,
              evidence: { riskScore, maxAllowed },
              status: GovernanceViolationStatus.OPEN,
            });
          }
          break;
        }
      }
    }

    return violations;
  }
}

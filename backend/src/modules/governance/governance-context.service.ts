import { Injectable } from "@nestjs/common";
import { GovernanceReviewService } from "./governance-review.service.js";
import { ArchitectureDiffService } from "./architecture-diff.service.js";

@Injectable()
export class GovernanceContextService {
  constructor(
    private readonly reviewService: GovernanceReviewService,
    private readonly diffService: ArchitectureDiffService,
  ) {}

  async getGovernanceContext(
    userId: string,
    repositoryId: string,
  ): Promise<string> {
    try {
      const summary = await this.reviewService.getGovernanceSummary(
        userId,
        repositoryId,
      );

      const violations = await this.reviewService.listViolations(
        userId,
        repositoryId,
        { status: "OPEN" },
      );

      const diffs = await this.diffService.listDiffs(repositoryId);
      const latestDiffDetail =
        diffs.length > 0
          ? await this.diffService.getDiffDetail(diffs[0].id)
          : null;

      let context = `[Architecture Governance Review Context]\n`;
      context += `Governance Status: ${summary.reviewStatus}\n`;
      context += `Current Risk Score: ${summary.currentRiskScore.toFixed(1)} (Delta: ${summary.riskDelta > 0 ? "+" : ""}${summary.riskDelta.toFixed(1)})\n`;
      context += `Open Violations: ${summary.openViolationsCount} (${summary.criticalViolationsCount} CRITICAL)\n`;

      if (violations.length > 0) {
        context += `\n--- Active Governance Violations ---\n`;
        violations.forEach((v) => {
          context += `- [${v.severity}] ${v.title}: ${v.description}\n`;
        });
      }

      if (latestDiffDetail && latestDiffDetail.items.length > 0) {
        context += `\n--- Recent Architecture Changes ---\n`;
        latestDiffDetail.items.slice(0, 10).forEach((item) => {
          context += `- [${item.type}] ${item.title}: ${item.description}\n`;
        });
      }

      return context;
    } catch {
      return "Architecture governance context unavailable.";
    }
  }
}

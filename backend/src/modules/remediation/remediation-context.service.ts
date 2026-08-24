import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class RemediationContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getRemediationContext(repositoryId: string): Promise<string> {
    const plans = await this.prisma.remediationPlan.findMany({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        patches: true,
        validations: { take: 3 },
        executions: { take: 1 },
      },
    });

    if (plans.length === 0) {
      return "No architecture remediation plans have been proposed for this repository yet.";
    }

    const lines: string[] = [
      "## Architecture Remediation Plans & Refactoring Status:",
    ];

    for (const plan of plans) {
      const execution = plan.executions[0];
      const prInfo = execution
        ? ` (PR: ${execution.pullRequestUrl || execution.branchName})`
        : "";

      lines.push(
        `- **Plan ID ${plan.id.slice(0, 8)}** [Status: ${plan.status}] (${plan.type}, Risk: ${plan.riskLevel})${prInfo}`,
      );
      lines.push(`  Title: ${plan.title}`);
      lines.push(`  Rationale: ${plan.rationale}`);
      if (plan.affectedFiles) {
        lines.push(
          `  Affected Files: ${(plan.affectedFiles as string[]).join(", ")}`,
        );
      }
    }

    return lines.join("\n");
  }
}

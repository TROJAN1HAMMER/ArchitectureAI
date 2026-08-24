import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { GovernanceRuleSeverity } from "@prisma/client";

export interface DefaultRuleConfig {
  name: string;
  description: string;
  ruleType: string;
  severity: GovernanceRuleSeverity;
  configuration?: any;
}

@Injectable()
export class GovernanceRuleService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultGlobalRules();
  }

  private async seedDefaultGlobalRules() {
    const defaultRules: DefaultRuleConfig[] = [
      {
        name: "No Circular Dependencies",
        description:
          "Rejects architectural circular dependency cycles across modules.",
        ruleType: "NO_CIRCULAR_DEPENDENCY",
        severity: GovernanceRuleSeverity.CRITICAL,
      },
      {
        name: "No Direct Frontend to Database Access",
        description:
          "Enforces architectural boundary preventing frontend components from directly accessing database schemas.",
        ruleType: "NO_FRONTEND_TO_DATABASE",
        severity: GovernanceRuleSeverity.HIGH,
      },
      {
        name: "No Database to Frontend Dependency",
        description:
          "Enforces reverse-layer boundary preventing database models from importing frontend assets.",
        ruleType: "NO_DATABASE_TO_FRONTEND",
        severity: GovernanceRuleSeverity.HIGH,
      },
      {
        name: "Excessive Component Coupling",
        description:
          "Flags architectural components exceeding maximum allowed inbound or outbound dependency count.",
        ruleType: "EXCESSIVE_COUPLING",
        severity: GovernanceRuleSeverity.MEDIUM,
        configuration: { maxDependencies: 10 },
      },
      {
        name: "Architecture Risk Score Threshold",
        description:
          "Triggers governance failure when overall risk score exceeds configured threshold.",
        ruleType: "RISK_SCORE_THRESHOLD",
        severity: GovernanceRuleSeverity.CRITICAL,
        configuration: { maxRiskScore: 60 },
      },
    ];

    for (const rule of defaultRules) {
      const existing = await this.prisma.governanceRule.findFirst({
        where: { ruleType: rule.ruleType, repositoryId: null },
      });

      if (!existing) {
        await this.prisma.governanceRule.create({
          data: {
            name: rule.name,
            description: rule.description,
            ruleType: rule.ruleType,
            severity: rule.severity,
            enabled: true,
            configuration: rule.configuration || undefined,
          },
        });
      }
    }
  }

  async listRules(repositoryId: string) {
    return this.prisma.governanceRule.findMany({
      where: {
        OR: [{ repositoryId: null }, { repositoryId }],
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async createRule(repositoryId: string, dto: DefaultRuleConfig) {
    return this.prisma.governanceRule.create({
      data: {
        repositoryId,
        name: dto.name,
        description: dto.description,
        ruleType: dto.ruleType,
        severity: dto.severity,
        enabled: true,
        configuration: dto.configuration || undefined,
      },
    });
  }

  async updateRule(
    ruleId: string,
    data: {
      enabled?: boolean;
      severity?: GovernanceRuleSeverity;
      configuration?: any;
    },
  ) {
    return this.prisma.governanceRule.update({
      where: { id: ruleId },
      data: {
        enabled: data.enabled,
        severity: data.severity,
        configuration: data.configuration || undefined,
      },
    });
  }

  async deleteRule(ruleId: string) {
    return this.prisma.governanceRule.delete({
      where: { id: ruleId },
    });
  }
}

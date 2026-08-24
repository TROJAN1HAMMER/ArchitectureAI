import { Injectable, ConflictException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { ArchitectureSnapshotService } from "./architecture-snapshot.service.js";
import { ArchitectureDiffService } from "./architecture-diff.service.js";
import { GovernanceRuleService } from "./governance-rule.service.js";
import { GovernanceEngineService } from "./governance-engine.service.js";
import { GovernanceRuleSeverity } from "@prisma/client";
import * as crypto from "crypto";

export type GovernanceReviewStatus = "PASS" | "PASS_WITH_WARNINGS" | "FAILED";

@Injectable()
export class GovernanceReviewService {
  private readonly logger = new Logger(GovernanceReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly knowledgeGraphService: KnowledgeGraphService,
    private readonly snapshotService: ArchitectureSnapshotService,
    private readonly diffService: ArchitectureDiffService,
    private readonly ruleService: GovernanceRuleService,
    private readonly engineService: GovernanceEngineService,
  ) {}

  async runGovernanceReview(userId: string, repositoryId: string) {
    // 1. Ownership check
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    // 2. Redis locking
    const redis = this.redisService.getClient();
    const lockKey = `repository:governance-lock:${repositoryId}`;
    const lockValue = crypto.randomUUID();

    const acquired = await redis.set(lockKey, lockValue, "EX", 600, "NX");
    if (!acquired) {
      throw new ConflictException(
        "Architecture governance review is already in progress for this repository",
      );
    }

    try {
      // 3. Create current snapshot
      const currentSnapshot = await this.snapshotService.createSnapshot(
        repositoryId,
        `Automated Review Snapshot`,
      );

      // 4. Find previous snapshot
      const previousSnapshot = await this.prisma.architectureSnapshot.findFirst(
        {
          where: {
            repositoryId,
            version: { lt: currentSnapshot!.version },
          },
          orderBy: { version: "desc" },
        },
      );

      let diff: any = null;
      if (previousSnapshot) {
        diff = await this.diffService.compareSnapshots(
          repositoryId,
          previousSnapshot.id,
          currentSnapshot!.id,
        );
      }

      // 5. Evaluate Governance Rules
      const rules = await this.ruleService.listRules(repositoryId);
      const evaluatedViolations = this.engineService.evaluateRules(
        rules,
        currentSnapshot!.architectureAnalysis,
        diff,
      );

      // 6. Persist Violations Idempotently
      for (const v of evaluatedViolations) {
        const existing = await this.prisma.governanceViolation.findFirst({
          where: {
            repositoryId,
            ruleId: v.ruleId,
            title: v.title,
            status: "OPEN",
          },
        });

        if (!existing) {
          await this.prisma.governanceViolation.create({
            data: {
              repositoryId,
              ruleId: v.ruleId,
              architectureAnalysisId:
                currentSnapshot?.architectureAnalysisId || null,
              diffId: diff?.id || null,
              severity: v.severity,
              title: v.title,
              description: v.description,
              confidence: v.confidence,
              sourceNodeId: v.sourceNodeId || null,
              targetNodeId: v.targetNodeId || null,
              evidence: v.evidence || undefined,
              status: v.status,
            },
          });
        }
      }

      // 7. Calculate Review Status & Summary
      const activeViolations = await this.prisma.governanceViolation.findMany({
        where: { repositoryId, status: "OPEN" },
      });

      const hasCritical = activeViolations.some(
        (v) => v.severity === GovernanceRuleSeverity.CRITICAL,
      );
      const hasHigh = activeViolations.some(
        (v) => v.severity === GovernanceRuleSeverity.HIGH,
      );

      let status: GovernanceReviewStatus = "PASS" as GovernanceReviewStatus;
      if (hasCritical || hasHigh) {
        status = "FAILED" as GovernanceReviewStatus;
      } else if (activeViolations.length > 0) {
        status = "PASS_WITH_WARNINGS" as GovernanceReviewStatus;
      }

      return {
        repositoryId,
        reviewStatus: status,
        currentSnapshotId: currentSnapshot!.id,
        previousSnapshotId: previousSnapshot?.id || null,
        diffId: diff?.id || null,
        riskScore: currentSnapshot!.riskScore,
        riskDelta: diff ? diff.riskDelta : 0.0,
        openViolationsCount: activeViolations.length,
        criticalViolationsCount: activeViolations.filter(
          (v) => v.severity === "CRITICAL",
        ).length,
        reviewedAt: new Date(),
      };
    } finally {
      // Safe Redis lock release
      try {
        const val = await redis.get(lockKey);
        if (val === lockValue) {
          await redis.del(lockKey);
        }
      } catch (err) {
        this.logger.error("Failed releasing Redis governance lock", err);
      }
    }
  }

  async getGovernanceSummary(userId: string, repositoryId: string) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    const latestSnapshot =
      await this.snapshotService.getLatestSnapshot(repositoryId);

    if (!latestSnapshot) {
      return {
        repositoryId,
        reviewStatus: "NOT_RUN",
        currentRiskScore: 0.0,
        riskDelta: 0.0,
        latestSnapshotVersion: 0,
        openViolationsCount: 0,
        criticalViolationsCount: 0,
        lastReviewedAt: null,
        latestDiff: null,
      };
    }

    const violations = await this.prisma.governanceViolation.findMany({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
      include: { rule: true },
    });

    const openViolations = violations.filter((v) => v.status === "OPEN");
    const hasCritical = openViolations.some((v) => v.severity === "CRITICAL");
    const hasHigh = openViolations.some((v) => v.severity === "HIGH");

    let reviewStatus: GovernanceReviewStatus = "PASS" as GovernanceReviewStatus;
    if (hasCritical || hasHigh) {
      reviewStatus = "FAILED" as GovernanceReviewStatus;
    } else if (openViolations.length > 0) {
      reviewStatus = "PASS_WITH_WARNINGS" as GovernanceReviewStatus;
    }

    const latestDiff = await this.prisma.architectureDiff.findFirst({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
      include: {
        fromSnapshot: true,
        toSnapshot: true,
      },
    });

    return {
      repositoryId,
      reviewStatus,
      currentRiskScore: latestSnapshot.riskScore || 0.0,
      riskDelta: latestDiff ? latestDiff.riskDelta : 0.0,
      latestSnapshotVersion: latestSnapshot.version || 0,
      openViolationsCount: openViolations.length,
      criticalViolationsCount: openViolations.filter(
        (v) => v.severity === "CRITICAL",
      ).length,
      lastReviewedAt: latestSnapshot.createdAt || null,
      latestDiff,
    };
  }

  async listViolations(
    userId: string,
    repositoryId: string,
    query?: { severity?: GovernanceRuleSeverity; status?: any },
  ) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    return this.prisma.governanceViolation.findMany({
      where: {
        repositoryId,
        severity: query?.severity || undefined,
        status: query?.status || undefined,
      },
      orderBy: { createdAt: "desc" },
      include: {
        rule: true,
        sourceNode: true,
        targetNode: true,
      },
    });
  }

  async updateViolationStatus(
    userId: string,
    repositoryId: string,
    violationId: string,
    status: any,
  ) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    return this.prisma.governanceViolation.update({
      where: { id: violationId, repositoryId },
      data: { status },
    });
  }
}

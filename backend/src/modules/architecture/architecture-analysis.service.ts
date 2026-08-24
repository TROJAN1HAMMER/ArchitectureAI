import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { ArchitectureDiscoveryService } from "./architecture-discovery.service.js";
import { ArchitectureAuditorService } from "./architecture-auditor.service.js";
import { ArchitecturePatternService } from "./architecture-pattern.service.js";
import { ArchitectureRiskService } from "./architecture-risk.service.js";
import { ArchitectureAnalysisStatus } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class ArchitectureAnalysisService {
  private readonly logger = new Logger(ArchitectureAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly knowledgeGraphService: KnowledgeGraphService,
    private readonly discoveryService: ArchitectureDiscoveryService,
    private readonly auditorService: ArchitectureAuditorService,
    private readonly patternService: ArchitecturePatternService,
    private readonly riskService: ArchitectureRiskService,
  ) {}

  async runAnalysis(userId: string, repositoryId: string) {
    // 1. Verify repository ownership
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    // 2. Redis Concurrency Locking (10 minutes TTL, NX)
    const redis = this.redisService.getClient();
    const lockKey = `repository:architecture-lock:${repositoryId}`;
    const lockValue = crypto.randomUUID();

    const acquired = await redis.set(lockKey, lockValue, "EX", 600, "NX");
    if (!acquired) {
      throw new ConflictException(
        "Architecture analysis is already in progress for this repository",
      );
    }

    let analysisId: string | undefined;

    try {
      // 3. Create RUNNING Analysis Record
      const analysis = await this.prisma.architectureAnalysis.create({
        data: {
          repositoryId,
          status: ArchitectureAnalysisStatus.RUNNING,
          startedAt: new Date(),
        },
      });
      analysisId = analysis.id;

      // 4. Fetch Graph Nodes & Edges
      const [nodes, edges] = await Promise.all([
        this.prisma.graphNode.findMany({ where: { repositoryId } }),
        this.prisma.graphEdge.findMany({ where: { repositoryId } }),
      ]);

      // 5. Discover Components & Patterns
      const components = this.discoveryService.discoverComponents(nodes, edges);
      const { patterns, findings: patternFindings } =
        this.patternService.detectPatterns(nodes, edges);

      // 6. Run Structural Audit
      const auditFindings = this.auditorService.auditArchitecture(nodes, edges);

      // Combined Findings
      const allFindings = [...auditFindings, ...patternFindings];

      // 7. Calculate Risk Score
      const riskResult = this.riskService.calculateRiskScore(allFindings);

      // 8. Persist Findings in DB
      for (const finding of allFindings) {
        await this.prisma.architectureFinding.create({
          data: {
            analysisId: analysis.id,
            repositoryId,
            type: finding.type,
            severity: finding.severity,
            title: finding.title,
            description: finding.description,
            confidence: finding.confidence,
            sourceNodeId: finding.sourceNodeId || null,
            targetNodeId: finding.targetNodeId || null,
            evidence: finding.evidence || undefined,
            metadata: finding.metadata || undefined,
          },
        });
      }

      // 9. Update Analysis Record to SUCCESS
      const updatedAnalysis = await this.prisma.architectureAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: ArchitectureAnalysisStatus.SUCCESS,
          completedAt: new Date(),
          nodesAnalyzed: nodes.length,
          edgesAnalyzed: edges.length,
          findingsGenerated: allFindings.length,
          riskScore: riskResult.score,
          riskLevel: riskResult.level,
          metadata: {
            patterns,
            components,
            riskExplanation: riskResult.explanation,
            riskFactors: riskResult.factors,
          } as any,
        },
      });

      return {
        analysisId: updatedAnalysis.id,
        status: updatedAnalysis.status,
        riskScore: updatedAnalysis.riskScore,
        riskLevel: updatedAnalysis.riskLevel,
        findingsGenerated: updatedAnalysis.findingsGenerated,
      };
    } catch (err: any) {
      this.logger.error(
        `Architecture analysis failed for repo ${repositoryId}: ${err.message}`,
        err.stack,
      );

      if (analysisId) {
        await this.prisma.architectureAnalysis.update({
          where: { id: analysisId },
          data: {
            status: ArchitectureAnalysisStatus.FAILED,
            completedAt: new Date(),
            errorMessage: err.message || "Unknown analysis failure",
          },
        });
      }

      throw err;
    } finally {
      // 10. Release Redis lock safely
      try {
        const currentValue = await redis.get(lockKey);
        if (currentValue === lockValue) {
          await redis.del(lockKey);
        }
      } catch (err) {
        this.logger.error("Failed releasing Redis architecture lock", err);
      }
    }
  }

  async getLatestSummary(userId: string, repositoryId: string) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    const latest = await this.prisma.architectureAnalysis.findFirst({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { findings: true },
        },
      },
    });

    if (!latest) {
      return {
        repositoryId,
        status: "NOT_RUN",
        riskScore: 0,
        riskLevel: "LOW",
        nodesAnalyzed: 0,
        edgesAnalyzed: 0,
        findingsGenerated: 0,
        patterns: [],
        components: [],
      };
    }

    const meta = (latest.metadata as any) || {};

    return {
      analysisId: latest.id,
      repositoryId: latest.repositoryId,
      status: latest.status,
      riskScore: latest.riskScore,
      riskLevel: latest.riskLevel,
      nodesAnalyzed: latest.nodesAnalyzed,
      edgesAnalyzed: latest.edgesAnalyzed,
      findingsGenerated: latest.findingsGenerated,
      completedAt: latest.completedAt,
      errorMessage: latest.errorMessage,
      patterns: meta.patterns || [],
      riskExplanation: meta.riskExplanation || "",
    };
  }

  async getFindings(
    userId: string,
    repositoryId: string,
    query: {
      type?: string;
      severity?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    const limit = Math.min(Math.max(1, query.limit || 50), 200);
    const offset = Math.max(0, query.offset || 0);

    const where: any = { repositoryId };
    if (query.type) where.type = query.type;
    if (query.severity) where.severity = query.severity;

    const [findings, totalCount] = await Promise.all([
      this.prisma.architectureFinding.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      }),
      this.prisma.architectureFinding.count({ where }),
    ]);

    return {
      findings,
      totalCount,
      limit,
      offset,
    };
  }

  async getFindingDetail(
    userId: string,
    repositoryId: string,
    findingId: string,
  ) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    const finding = await this.prisma.architectureFinding.findFirst({
      where: { id: findingId, repositoryId },
      include: {
        sourceNode: true,
        targetNode: true,
      },
    });

    if (!finding) {
      throw new NotFoundException("Architecture finding not found");
    }

    return finding;
  }

  async getComponents(userId: string, repositoryId: string) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    const latest = await this.prisma.architectureAnalysis.findFirst({
      where: { repositoryId, status: ArchitectureAnalysisStatus.SUCCESS },
      orderBy: { createdAt: "desc" },
    });

    if (!latest || !latest.metadata) {
      return { components: [] };
    }

    const meta = latest.metadata as any;
    return { components: meta.components || [] };
  }

  async getHistory(userId: string, repositoryId: string) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    return this.prisma.architectureAnalysis.findMany({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }
}

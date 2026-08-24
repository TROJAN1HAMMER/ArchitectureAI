import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisLockService } from "../../common/redis/redis-lock.service.js";
import { EnterpriseSystemService } from "./enterprise-system.service.js";
import { TopologyDiscoveryService } from "./topology-discovery.service.js";
import { TopologyAuditorService } from "./topology-auditor.service.js";
import { TopologyRiskService } from "./topology-risk.service.js";
import { RepositoryDependencyService } from "./repository-dependency.service.js";
import { EnterpriseTopologyStatus } from "@prisma/client";

@Injectable()
export class TopologyAnalysisService {
  private readonly logger = new Logger(TopologyAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisLock: RedisLockService,
    private readonly enterpriseSystemService: EnterpriseSystemService,
    private readonly discoveryService: TopologyDiscoveryService,
    private readonly auditorService: TopologyAuditorService,
    private readonly riskService: TopologyRiskService,
    private readonly dependencyService: RepositoryDependencyService,
  ) {}

  async analyzeTopology(userId: string, enterpriseSystemId: string) {
    await this.enterpriseSystemService.verifySystemOwnership(
      userId,
      enterpriseSystemId,
    );

    const lockKey = `enterprise-topology-lock:${enterpriseSystemId}`;
    const lockTtl = 600; // 600 seconds

    return this.redisLock
      .runWithLock(lockKey, lockTtl, async () => {
        this.logger.log(
          `Starting enterprise topology analysis for system ${enterpriseSystemId}`,
        );

        const system = await this.prisma.enterpriseSystem.findUnique({
          where: { id: enterpriseSystemId },
          include: { repositories: true },
        });

        if (!system) {
          throw new NotFoundException(
            `Enterprise system ${enterpriseSystemId} not found`,
          );
        }

        // Create PENDING analysis record
        const analysis = await this.prisma.enterpriseTopologyAnalysis.create({
          data: {
            enterpriseSystemId,
            status: EnterpriseTopologyStatus.RUNNING,
            startedAt: new Date(),
          },
        });

        try {
          // 1. Discover dependencies
          const discovered =
            await this.discoveryService.discoverDependencies(
              enterpriseSystemId,
            );

          // 2. Persist dependencies
          for (const dep of discovered) {
            await this.dependencyService.createOrUpdateDependency({
              enterpriseSystemId,
              sourceRepositoryId: dep.sourceRepositoryId,
              targetRepositoryId: dep.targetRepositoryId,
              type: dep.type,
              confidence: dep.confidence,
              evidence: dep.evidence,
            });
          }

          // 3. Audit topology
          const findings =
            await this.auditorService.auditTopology(enterpriseSystemId);

          // 4. Calculate risk score
          const riskResult = this.riskService.calculateRiskScore(findings);

          // 5. Persist findings
          await this.prisma.enterpriseTopologyFinding.deleteMany({
            where: { enterpriseSystemId },
          });

          for (const f of findings) {
            await this.prisma.enterpriseTopologyFinding.create({
              data: {
                analysisId: analysis.id,
                enterpriseSystemId,
                type: f.type,
                severity: f.severity,
                title: f.title,
                description: f.description,
                confidence: f.confidence,
                sourceRepositoryId: f.sourceRepositoryId || null,
                targetRepositoryId: f.targetRepositoryId || null,
                evidence: (f.evidence as any) || {},
                metadata: (f.metadata as any) || {},
              },
            });
          }

          // 6. Complete analysis record
          const completedAnalysis =
            await this.prisma.enterpriseTopologyAnalysis.update({
              where: { id: analysis.id },
              data: {
                status: EnterpriseTopologyStatus.SUCCESS,
                completedAt: new Date(),
                repositoriesAnalyzed: system.repositories.length,
                dependenciesAnalyzed: discovered.length,
                findingsGenerated: findings.length,
                riskScore: riskResult.riskScore,
                riskLevel: riskResult.riskLevel,
                factorBreakdown: (riskResult.factorBreakdown as any) || {},
              },
              include: {
                findings: true,
              },
            });

          this.logger.log(
            `Completed enterprise topology analysis ${analysis.id} for system ${enterpriseSystemId} with risk score ${riskResult.riskScore}`,
          );

          return completedAnalysis;
        } catch (err: any) {
          this.logger.error(
            `Topology analysis failed for system ${enterpriseSystemId}: ${err.message}`,
            err.stack,
          );

          await this.prisma.enterpriseTopologyAnalysis.update({
            where: { id: analysis.id },
            data: {
              status: EnterpriseTopologyStatus.FAILED,
              errorMessage:
                err.message || "Unknown error during topology analysis",
              completedAt: new Date(),
            },
          });

          throw err;
        }
      })
      .catch((err) => {
        if (err.message && err.message.includes("lock")) {
          throw new ConflictException(
            `Topology analysis already in progress for enterprise system ${enterpriseSystemId}`,
          );
        }
        throw err;
      });
  }

  async getAnalysisHistory(userId: string, enterpriseSystemId: string) {
    await this.enterpriseSystemService.verifySystemOwnership(
      userId,
      enterpriseSystemId,
    );

    return this.prisma.enterpriseTopologyAnalysis.findMany({
      where: { enterpriseSystemId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }
}

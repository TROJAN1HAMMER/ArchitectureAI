import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import {
  EnterpriseSystemService,
  CreateSystemDto,
  UpdateSystemDto,
} from "./enterprise-system.service.js";
import { TopologyAnalysisService } from "./topology-analysis.service.js";
import { RepositoryDependencyService } from "./repository-dependency.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";

@Controller("api/v1/systems")
@UseGuards(JwtAuthGuard)
export class EnterpriseTopologyController {
  constructor(
    private readonly systemService: EnterpriseSystemService,
    private readonly analysisService: TopologyAnalysisService,
    private readonly dependencyService: RepositoryDependencyService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async listSystems(@CurrentUser("id") userId: string) {
    return this.systemService.listSystems(userId);
  }

  @Post()
  async createSystem(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateSystemDto,
  ) {
    return this.systemService.createSystem(userId, dto);
  }

  @Get(":id")
  async getSystem(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
  ) {
    return this.systemService.getSystem(userId, systemId);
  }

  @Patch(":id")
  async updateSystem(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
    @Body() dto: UpdateSystemDto,
  ) {
    return this.systemService.updateSystem(userId, systemId, dto);
  }

  @Delete(":id")
  async deleteSystem(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
  ) {
    return this.systemService.deleteSystem(userId, systemId);
  }

  @Post(":id/repositories/:repositoryId")
  async addRepository(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
    @Param("repositoryId") repositoryId: string,
  ) {
    return this.systemService.addRepositoryToSystem(
      userId,
      systemId,
      repositoryId,
    );
  }

  @Delete(":id/repositories/:repositoryId")
  async removeRepository(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
    @Param("repositoryId") repositoryId: string,
  ) {
    return this.systemService.removeRepositoryFromSystem(
      userId,
      systemId,
      repositoryId,
    );
  }

  @Get(":id/topology")
  async getTopology(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
  ) {
    await this.systemService.verifySystemOwnership(userId, systemId);

    const system = await this.prisma.enterpriseSystem.findUnique({
      where: { id: systemId },
      include: {
        repositories: {
          select: {
            id: true,
            name: true,
            fullName: true,
            role: true,
            language: true,
            stars: true,
          },
        },
        dependencies: {
          include: {
            sourceRepository: { select: { id: true, name: true, role: true } },
            targetRepository: { select: { id: true, name: true, role: true } },
          },
        },
        analyses: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!system) {
      throw new NotFoundException(`Enterprise system ${systemId} not found`);
    }

    const latestAnalysis = system.analyses[0] || null;

    return {
      systemId: system.id,
      name: system.name,
      description: system.description,
      nodes: system.repositories.map((r) => ({
        repositoryId: r.id,
        name: r.name,
        fullName: r.fullName,
        role: r.role,
        language: r.language,
        stars: r.stars,
      })),
      edges: system.dependencies.map((d) => ({
        id: d.id,
        sourceRepositoryId: d.sourceRepositoryId,
        targetRepositoryId: d.targetRepositoryId,
        sourceName: d.sourceRepository.name,
        targetName: d.targetRepository.name,
        type: d.type,
        confidence: d.confidence,
        evidence: d.evidence,
      })),
      latestAnalysis: latestAnalysis
        ? {
            id: latestAnalysis.id,
            status: latestAnalysis.status,
            riskScore: latestAnalysis.riskScore,
            riskLevel: latestAnalysis.riskLevel,
            completedAt: latestAnalysis.completedAt,
            factorBreakdown: latestAnalysis.factorBreakdown,
          }
        : null,
    };
  }

  @Post(":id/topology/analyze")
  async analyzeTopology(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
  ) {
    return this.analysisService.analyzeTopology(userId, systemId);
  }

  @Get(":id/topology/dependencies")
  async getDependencies(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
  ) {
    await this.systemService.verifySystemOwnership(userId, systemId);
    return this.dependencyService.getDependenciesForSystem(systemId);
  }

  @Get(":id/topology/findings")
  async getFindings(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
  ) {
    await this.systemService.verifySystemOwnership(userId, systemId);

    return this.prisma.enterpriseTopologyFinding.findMany({
      where: { enterpriseSystemId: systemId },
      include: {
        sourceRepository: { select: { id: true, name: true } },
        targetRepository: { select: { id: true, name: true } },
      },
      orderBy: { severity: "asc" },
    });
  }

  @Get(":id/topology/findings/:findingId")
  async getFinding(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
    @Param("findingId") findingId: string,
  ) {
    await this.systemService.verifySystemOwnership(userId, systemId);

    const finding = await this.prisma.enterpriseTopologyFinding.findFirst({
      where: { id: findingId, enterpriseSystemId: systemId },
      include: {
        sourceRepository: { select: { id: true, name: true, role: true } },
        targetRepository: { select: { id: true, name: true, role: true } },
      },
    });

    if (!finding) {
      throw new NotFoundException(
        `Finding ${findingId} not found in system ${systemId}`,
      );
    }

    return finding;
  }

  @Get(":id/topology/history")
  async getHistory(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
  ) {
    return this.analysisService.getAnalysisHistory(userId, systemId);
  }

  @Get(":id/topology/repositories")
  async getRepositories(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
  ) {
    await this.systemService.verifySystemOwnership(userId, systemId);

    return this.prisma.repository.findMany({
      where: { enterpriseSystemId: systemId },
      orderBy: { name: "asc" },
    });
  }

  @Get(":id/topology/neighborhood/:repositoryId")
  async getNeighborhood(
    @CurrentUser("id") userId: string,
    @Param("id") systemId: string,
    @Param("repositoryId") repositoryId: string,
  ) {
    await this.systemService.verifySystemOwnership(userId, systemId);

    const targetRepo = await this.prisma.repository.findFirst({
      where: { id: repositoryId, enterpriseSystemId: systemId },
    });

    if (!targetRepo) {
      throw new NotFoundException(
        `Repository ${repositoryId} not found in system ${systemId}`,
      );
    }

    const dependencies = await this.prisma.repositoryDependency.findMany({
      where: {
        enterpriseSystemId: systemId,
        OR: [
          { sourceRepositoryId: repositoryId },
          { targetRepositoryId: repositoryId },
        ],
      },
      include: {
        sourceRepository: { select: { id: true, name: true, role: true } },
        targetRepository: { select: { id: true, name: true, role: true } },
      },
    });

    const relatedRepoIds = new Set<string>();
    relatedRepoIds.add(repositoryId);
    for (const d of dependencies) {
      relatedRepoIds.add(d.sourceRepositoryId);
      relatedRepoIds.add(d.targetRepositoryId);
    }

    const nodes = await this.prisma.repository.findMany({
      where: { id: { in: Array.from(relatedRepoIds) } },
      select: {
        id: true,
        name: true,
        fullName: true,
        role: true,
        language: true,
      },
    });

    return {
      targetRepository: targetRepo,
      nodes,
      edges: dependencies,
    };
  }
}

import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { LoggerModule } from "../../common/logger/logger.module.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { RepositoryGraphBuilderService } from "../knowledge-graph/repository-graph-builder.service.js";
import { ArchitectureDiscoveryService } from "../architecture/architecture-discovery.service.js";
import { ArchitectureAuditorService } from "../architecture/architecture-auditor.service.js";
import { ArchitecturePatternService } from "../architecture/architecture-pattern.service.js";
import { ArchitectureRiskService } from "../architecture/architecture-risk.service.js";
import { ArchitectureAnalysisService } from "../architecture/architecture-analysis.service.js";
import { SystemDesignDiscoveryService } from "../system-design/system-design-discovery.service.js";
import { DiagramGenerationService } from "../system-design/diagram-generation.service.js";
import { DiagramLayoutService } from "../system-design/diagram-layout.service.js";
import { SystemDesignService } from "../system-design/system-design.service.js";
import { ArchitectureSnapshotService } from "./architecture-snapshot.service.js";
import { ArchitectureDiffService } from "./architecture-diff.service.js";
import { GovernanceRuleService } from "./governance-rule.service.js";
import { GovernanceEngineService } from "./governance-engine.service.js";
import { GovernanceReviewService } from "./governance-review.service.js";
import { GovernanceContextService } from "./governance-context.service.js";
import { ConfigModule } from "@nestjs/config";

describe("Phase 10 Architecture Review & Governance Integration Test", () => {
  let prisma: PrismaService;
  let graphBuilder: RepositoryGraphBuilderService;
  let archAnalysisService: ArchitectureAnalysisService;
  let reviewService: GovernanceReviewService;
  let contextService: GovernanceContextService;

  let testUserId: string;
  let testRepoId: string;

  beforeAll(async () => {
    const mockRedisStore = new Map<string, string>();
    const mockRedisClient = {
      set: jest
        .fn()
        .mockImplementation(
          async (
            key: string,
            val: string,
            _flag1?: string,
            _expire?: number,
            flag2?: string,
          ) => {
            if (flag2 === "NX" && mockRedisStore.has(key)) {
              return null;
            }
            mockRedisStore.set(key, val);
            return "OK";
          },
        ),
      get: jest.fn().mockImplementation(async (key: string) => {
        return mockRedisStore.get(key) || null;
      }),
      del: jest.fn().mockImplementation(async (key: string) => {
        mockRedisStore.delete(key);
        return 1;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        PrismaService,
        {
          provide: RedisService,
          useValue: {
            getClient: () => mockRedisClient,
            onModuleInit: jest.fn(),
            onModuleDestroy: jest.fn(),
          },
        },
        KnowledgeGraphService,
        RepositoryGraphBuilderService,
        ArchitectureDiscoveryService,
        ArchitectureAuditorService,
        ArchitecturePatternService,
        ArchitectureRiskService,
        ArchitectureAnalysisService,
        SystemDesignDiscoveryService,
        DiagramGenerationService,
        DiagramLayoutService,
        SystemDesignService,
        ArchitectureSnapshotService,
        ArchitectureDiffService,
        GovernanceRuleService,
        GovernanceEngineService,
        GovernanceReviewService,
        GovernanceContextService,
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    graphBuilder = module.get<RepositoryGraphBuilderService>(
      RepositoryGraphBuilderService,
    );
    archAnalysisService = module.get<ArchitectureAnalysisService>(
      ArchitectureAnalysisService,
    );
    reviewService = module.get<GovernanceReviewService>(
      GovernanceReviewService,
    );
    contextService = module.get<GovernanceContextService>(
      GovernanceContextService,
    );

    // 1. Create test user
    let user = await prisma.user.findFirst({
      where: { email: "gov-user@example.com" },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "gov-user@example.com",
          name: "Gov User",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserId = user.id;

    // 2. Create test repository
    let repo = await prisma.repository.findUnique({
      where: { githubRepositoryId: "gov-repo-888" },
    });
    if (!repo) {
      repo = await prisma.repository.create({
        data: {
          githubRepositoryId: "gov-repo-888",
          ownerLogin: "govowner",
          name: "architectai-gov",
          fullName: "govowner/architectai-gov",
          defaultBranch: "main",
          visibility: "public",
          isPrivate: false,
          language: "TypeScript",
          htmlUrl: "https://github.com/govowner/architectai-gov",
        },
      });
    }
    testRepoId = repo.id;

    await prisma.repositoryConnection.upsert({
      where: {
        userId_repositoryId: { userId: testUserId, repositoryId: testRepoId },
      },
      create: { userId: testUserId, repositoryId: testRepoId },
      update: { disconnectedAt: null },
    });

    // 3. Initial file setup
    await prisma.repositoryFile.upsert({
      where: {
        repositoryId_path: {
          repositoryId: testRepoId,
          path: "backend/src/modules/auth/auth.service.ts",
        },
      },
      create: {
        repositoryId: testRepoId,
        path: "backend/src/modules/auth/auth.service.ts",
        name: "auth.service.ts",
        extension: "ts",
        type: "blob",
        size: 500,
        sha: "sha-1",
        parentPath: "backend/src/modules/auth",
      },
      update: {},
    });

    // Build initial graph & architecture analysis
    await graphBuilder.buildGraph(testUserId, testRepoId);
    await archAnalysisService.runAnalysis(testUserId, testRepoId);
  });

  afterAll(async () => {
    if (prisma) {
      if (testRepoId) {
        await prisma.repository
          .delete({ where: { id: testRepoId } })
          .catch(() => {});
      }
      if (testUserId) {
        await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
      }
      await prisma.$disconnect();
    }
  });

  it("should run governance review, create snapshot 1, compute diff when modified, and evaluate governance rules", async () => {
    // Review 1
    const review1 = await reviewService.runGovernanceReview(
      testUserId,
      testRepoId,
    );
    expect(review1.currentSnapshotId).toBeDefined();
    expect(review1.reviewStatus).toBe("PASS");

    // Modify architecture (add database file)
    await prisma.repositoryFile.create({
      data: {
        repositoryId: testRepoId,
        path: "backend/prisma/schema.prisma",
        name: "schema.prisma",
        extension: "prisma",
        type: "blob",
        size: 800,
        sha: "sha-2",
        parentPath: "backend/prisma",
      },
    });

    await graphBuilder.buildGraph(testUserId, testRepoId);
    await archAnalysisService.runAnalysis(testUserId, testRepoId);

    // Review 2
    const review2 = await reviewService.runGovernanceReview(
      testUserId,
      testRepoId,
    );
    expect(review2.previousSnapshotId).toBe(review1.currentSnapshotId);
    expect(review2.diffId).toBeDefined();
  });

  it("should format grounded governance context for RAG assistant", async () => {
    const contextText = await contextService.getGovernanceContext(
      testUserId,
      testRepoId,
    );
    expect(contextText).toContain("Architecture Governance Review Context");
    expect(contextText).toContain("Governance Status:");
  });

  it("should reject non-owner user from fetching governance summary (IDOR protection)", async () => {
    await expect(
      reviewService.getGovernanceSummary("unauthorized-user-id", testRepoId),
    ).rejects.toThrow();
  });
});

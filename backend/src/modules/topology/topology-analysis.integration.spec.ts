import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { RedisLockService } from "../../common/redis/redis-lock.service.js";
import { LoggerModule } from "../../common/logger/logger.module.js";
import { EnterpriseSystemService } from "./enterprise-system.service.js";
import { RepositoryDependencyService } from "./repository-dependency.service.js";
import { TopologyDiscoveryService } from "./topology-discovery.service.js";
import { TopologyAuditorService } from "./topology-auditor.service.js";
import { TopologyRiskService } from "./topology-risk.service.js";
import { TopologyAnalysisService } from "./topology-analysis.service.js";
import { TopologyContextService } from "./topology-context.service.js";
import { ConfigModule } from "@nestjs/config";
import { EnterpriseTopologyStatus, RepositoryRole } from "@prisma/client";
import { NotFoundException } from "@nestjs/common";

describe("Phase 13 Enterprise Topology Analysis Integration Test", () => {
  let prisma: PrismaService;
  let systemService: EnterpriseSystemService;
  let analysisService: TopologyAnalysisService;
  let topologyContextService: TopologyContextService;

  let testUserAId: string;
  let testUserBId: string;
  let testSystemId: string;
  let testRepo1Id: string;
  let testRepo2Id: string;
  let testRepo3Id: string;

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
      ping: jest.fn().mockResolvedValue("PONG"),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        PrismaService,
        {
          provide: RedisService,
          useValue: {
            getClient: () => mockRedisClient,
            ping: () => mockRedisClient.ping(),
            onModuleInit: jest.fn(),
            onModuleDestroy: jest.fn(),
          },
        },
        RedisLockService,
        EnterpriseSystemService,
        RepositoryDependencyService,
        TopologyDiscoveryService,
        TopologyAuditorService,
        TopologyRiskService,
        TopologyAnalysisService,
        TopologyContextService,
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    systemService = module.get<EnterpriseSystemService>(
      EnterpriseSystemService,
    );
    analysisService = module.get<TopologyAnalysisService>(
      TopologyAnalysisService,
    );
    topologyContextService = module.get<TopologyContextService>(
      TopologyContextService,
    );

    // Create User A
    let userA = await prisma.user.findFirst({
      where: { email: "topo-user-a@example.com" },
    });
    if (!userA) {
      userA = await prisma.user.create({
        data: {
          email: "topo-user-a@example.com",
          name: "Topology User A",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserAId = userA.id;

    // Create User B
    let userB = await prisma.user.findFirst({
      where: { email: "topo-user-b@example.com" },
    });
    if (!userB) {
      userB = await prisma.user.create({
        data: {
          email: "topo-user-b@example.com",
          name: "Topology User B",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserBId = userB.id;

    // Create 3 Repositories owned by User A
    const repo1 = await prisma.repository.create({
      data: {
        githubRepositoryId: "topo-repo-111",
        ownerLogin: "topoowner",
        name: "frontend-ui-app",
        fullName: "topoowner/frontend-ui-app",
        defaultBranch: "main",
        visibility: "public",
        isPrivate: false,
        role: RepositoryRole.FRONTEND,
        htmlUrl: "https://github.com/topoowner/frontend-ui-app",
      },
    });
    testRepo1Id = repo1.id;

    const repo2 = await prisma.repository.create({
      data: {
        githubRepositoryId: "topo-repo-222",
        ownerLogin: "topoowner",
        name: "order-service",
        fullName: "topoowner/order-service",
        defaultBranch: "main",
        visibility: "public",
        isPrivate: false,
        role: RepositoryRole.SERVICE,
        htmlUrl: "https://github.com/topoowner/order-service",
      },
    });
    testRepo2Id = repo2.id;

    const repo3 = await prisma.repository.create({
      data: {
        githubRepositoryId: "topo-repo-333",
        ownerLogin: "topoowner",
        name: "payment-service",
        fullName: "topoowner/payment-service",
        defaultBranch: "main",
        visibility: "public",
        isPrivate: false,
        role: RepositoryRole.SERVICE,
        htmlUrl: "https://github.com/topoowner/payment-service",
      },
    });
    testRepo3Id = repo3.id;

    // Connect User A to all 3 repos
    await prisma.repositoryConnection.createMany({
      data: [
        { userId: testUserAId, repositoryId: testRepo1Id },
        { userId: testUserAId, repositoryId: testRepo2Id },
        { userId: testUserAId, repositoryId: testRepo3Id },
      ],
    });
  });

  afterAll(async () => {
    if (prisma) {
      if (testSystemId) {
        await prisma.enterpriseSystem
          .delete({ where: { id: testSystemId } })
          .catch(() => {});
      }
      if (testRepo1Id)
        await prisma.repository
          .delete({ where: { id: testRepo1Id } })
          .catch(() => {});
      if (testRepo2Id)
        await prisma.repository
          .delete({ where: { id: testRepo2Id } })
          .catch(() => {});
      if (testRepo3Id)
        await prisma.repository
          .delete({ where: { id: testRepo3Id } })
          .catch(() => {});
      if (testUserAId)
        await prisma.user
          .delete({ where: { id: testUserAId } })
          .catch(() => {});
      if (testUserBId)
        await prisma.user
          .delete({ where: { id: testUserBId } })
          .catch(() => {});
      await prisma.$disconnect();
    }
  });

  it("1. System Creation & Repository Attachment", async () => {
    const sys = await systemService.createSystem(testUserAId, {
      name: "Global E-Commerce System",
      description:
        "Platform topology containing frontend, order, and payment services",
      repositoryIds: [testRepo1Id, testRepo2Id, testRepo3Id],
    });

    expect(sys.id).toBeDefined();
    expect(sys.repositories.length).toBe(3);
    testSystemId = sys.id;
  });

  it("2. Topology Analysis Execution: Dependency Discovery, Findings, Risk Scoring", async () => {
    const result = await analysisService.analyzeTopology(
      testUserAId,
      testSystemId,
    );

    expect(result.id).toBeDefined();
    expect(result.status).toBe(EnterpriseTopologyStatus.SUCCESS);
    expect(result.repositoriesAnalyzed).toBe(3);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);

    // Verify dependencies persisted in DB
    const deps = await prisma.repositoryDependency.findMany({
      where: { enterpriseSystemId: testSystemId },
    });
    expect(deps.length).toBeGreaterThan(0);
  });

  it("3. Idempotent Analysis Execution", async () => {
    const secondRun = await analysisService.analyzeTopology(
      testUserAId,
      testSystemId,
    );
    expect(secondRun.status).toBe(EnterpriseTopologyStatus.SUCCESS);

    const history = await analysisService.getAnalysisHistory(
      testUserAId,
      testSystemId,
    );
    expect(history.length).toBe(2);
  });

  it("4. Multi-Tenant Ownership Isolation", async () => {
    await expect(
      systemService.getSystem(testUserBId, testSystemId),
    ).rejects.toThrow(NotFoundException);

    await expect(
      analysisService.analyzeTopology(testUserBId, testSystemId),
    ).rejects.toThrow(NotFoundException);
  });

  it("5. Grounded RAG Topology Context", async () => {
    const context = await topologyContextService.getTopologyContext(
      testRepo1Id,
      "What is the enterprise topology for this system?",
    );

    expect(context).toContain("Global E-Commerce System");
    expect(context).toContain("frontend-ui-app");
    expect(context).toContain("order-service");
  });

  it("6. System Deletion Cascade Cleanup", async () => {
    const delRes = await systemService.deleteSystem(testUserAId, testSystemId);
    expect(delRes.success).toBe(true);

    const repo1After = await prisma.repository.findUnique({
      where: { id: testRepo1Id },
    });
    expect(repo1After?.enterpriseSystemId).toBeNull();
  });
});

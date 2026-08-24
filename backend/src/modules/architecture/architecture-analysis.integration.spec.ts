import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { LoggerModule } from "../../common/logger/logger.module.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { ArchitectureDiscoveryService } from "./architecture-discovery.service.js";
import { ArchitectureAuditorService } from "./architecture-auditor.service.js";
import { ArchitecturePatternService } from "./architecture-pattern.service.js";
import { ArchitectureRiskService } from "./architecture-risk.service.js";
import { ArchitectureAnalysisService } from "./architecture-analysis.service.js";
import { ArchitectureContextService } from "./architecture-context.service.js";
import { ConfigModule } from "@nestjs/config";
import { NodeType, EdgeType } from "@prisma/client";

describe("Phase 8 Architecture Discovery & Auditing Integration Test", () => {
  let prisma: PrismaService;
  let analysisService: ArchitectureAnalysisService;
  let contextService: ArchitectureContextService;

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
        ArchitectureDiscoveryService,
        ArchitectureAuditorService,
        ArchitecturePatternService,
        ArchitectureRiskService,
        ArchitectureAnalysisService,
        ArchitectureContextService,
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    analysisService = module.get<ArchitectureAnalysisService>(
      ArchitectureAnalysisService,
    );
    contextService = module.get<ArchitectureContextService>(
      ArchitectureContextService,
    );

    // 1. Create test user
    let user = await prisma.user.findFirst({
      where: { email: "arch-user@example.com" },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "arch-user@example.com",
          name: "Arch User",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserId = user.id;

    // 2. Create test repository
    let repo = await prisma.repository.findUnique({
      where: { githubRepositoryId: "arch-repo-888" },
    });
    if (!repo) {
      repo = await prisma.repository.create({
        data: {
          githubRepositoryId: "arch-repo-888",
          ownerLogin: "archowner",
          name: "architectai-arch",
          fullName: "archowner/architectai-arch",
          defaultBranch: "main",
          visibility: "public",
          isPrivate: false,
          language: "TypeScript",
          htmlUrl: "https://github.com/archowner/architectai-arch",
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

    // 3. Create GraphNodes (with boundary violation and circular dependency)
    const nodeA = await prisma.graphNode.upsert({
      where: {
        repositoryId_qualifiedName: {
          repositoryId: testRepoId,
          qualifiedName: "backend/src/modules/auth/auth.service.ts",
        },
      },
      create: {
        repositoryId: testRepoId,
        name: "auth.service.ts",
        qualifiedName: "backend/src/modules/auth/auth.service.ts",
        path: "backend/src/modules/auth/auth.service.ts",
        type: NodeType.FILE,
      },
      update: {},
    });

    const nodeB = await prisma.graphNode.upsert({
      where: {
        repositoryId_qualifiedName: {
          repositoryId: testRepoId,
          qualifiedName: "backend/src/modules/users/users.service.ts",
        },
      },
      create: {
        repositoryId: testRepoId,
        name: "users.service.ts",
        qualifiedName: "backend/src/modules/users/users.service.ts",
        path: "backend/src/modules/users/users.service.ts",
        type: NodeType.FILE,
      },
      update: {},
    });

    const nodeUI = await prisma.graphNode.upsert({
      where: {
        repositoryId_qualifiedName: {
          repositoryId: testRepoId,
          qualifiedName: "frontend/src/components/Login.tsx",
        },
      },
      create: {
        repositoryId: testRepoId,
        name: "Login.tsx",
        qualifiedName: "frontend/src/components/Login.tsx",
        path: "frontend/src/components/Login.tsx",
        type: NodeType.FILE,
      },
      update: {},
    });

    // 4. Create GraphEdges (Cycle A -> B -> A, Boundary Violation UI -> A)
    await prisma.graphEdge.upsert({
      where: {
        repositoryId_sourceNodeId_targetNodeId_type: {
          repositoryId: testRepoId,
          sourceNodeId: nodeA.id,
          targetNodeId: nodeB.id,
          type: EdgeType.IMPORTS,
        },
      },
      create: {
        repositoryId: testRepoId,
        sourceNodeId: nodeA.id,
        targetNodeId: nodeB.id,
        type: EdgeType.IMPORTS,
      },
      update: {},
    });

    await prisma.graphEdge.upsert({
      where: {
        repositoryId_sourceNodeId_targetNodeId_type: {
          repositoryId: testRepoId,
          sourceNodeId: nodeB.id,
          targetNodeId: nodeA.id,
          type: EdgeType.IMPORTS,
        },
      },
      create: {
        repositoryId: testRepoId,
        sourceNodeId: nodeB.id,
        targetNodeId: nodeA.id,
        type: EdgeType.IMPORTS,
      },
      update: {},
    });

    await prisma.graphEdge.upsert({
      where: {
        repositoryId_sourceNodeId_targetNodeId_type: {
          repositoryId: testRepoId,
          sourceNodeId: nodeUI.id,
          targetNodeId: nodeA.id,
          type: EdgeType.IMPORTS,
        },
      },
      create: {
        repositoryId: testRepoId,
        sourceNodeId: nodeUI.id,
        targetNodeId: nodeA.id,
        type: EdgeType.IMPORTS,
      },
      update: {},
    });
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

  it("should run architecture analysis, persist findings, and detect cycle & boundary violation", async () => {
    const result = await analysisService.runAnalysis(testUserId, testRepoId);
    expect(result.status).toBe("SUCCESS");
    expect(result.findingsGenerated).toBeGreaterThan(0);

    const findingsRes = await analysisService.getFindings(
      testUserId,
      testRepoId,
      {},
    );
    expect(findingsRes.findings.length).toBeGreaterThan(0);

    const cycleFinding = findingsRes.findings.find(
      (f) => f.type === "CIRCULAR_DEPENDENCY",
    );
    expect(cycleFinding).toBeDefined();

    const boundaryFinding = findingsRes.findings.find(
      (f) => f.type === "BOUNDARY_VIOLATION",
    );
    expect(boundaryFinding).toBeDefined();
  });

  it("should format grounded architecture context for RAG pipeline", async () => {
    const contextText = await contextService.getArchitectureContext(
      testUserId,
      testRepoId,
    );
    expect(contextText).toContain("Architectural Analysis Summary");
    expect(contextText).toContain("Risk Score");
  });

  it("should reject non-owner user from fetching architecture summary (IDOR protection)", async () => {
    await expect(
      analysisService.getLatestSummary("unauthorized-user-id", testRepoId),
    ).rejects.toThrow();
  });
});

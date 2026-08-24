import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { LoggerModule } from "../../common/logger/logger.module.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { SystemDesignDiscoveryService } from "./system-design-discovery.service.js";
import { DiagramGenerationService } from "./diagram-generation.service.js";
import { DiagramLayoutService } from "./diagram-layout.service.js";
import { SystemDesignService } from "./system-design.service.js";
import { SystemDesignContextService } from "./system-design-context.service.js";
import { ConfigModule } from "@nestjs/config";
import { NodeType } from "@prisma/client";

describe("Phase 9 System Design Studio Integration Test", () => {
  let prisma: PrismaService;
  let systemDesignService: SystemDesignService;
  let contextService: SystemDesignContextService;

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
        SystemDesignDiscoveryService,
        DiagramGenerationService,
        DiagramLayoutService,
        SystemDesignService,
        SystemDesignContextService,
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    systemDesignService = module.get<SystemDesignService>(SystemDesignService);
    contextService = module.get<SystemDesignContextService>(
      SystemDesignContextService,
    );

    // 1. Create test user
    let user = await prisma.user.findFirst({
      where: { email: "sd-user@example.com" },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "sd-user@example.com",
          name: "SD User",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserId = user.id;

    // 2. Create test repository
    let repo = await prisma.repository.findUnique({
      where: { githubRepositoryId: "sd-repo-777" },
    });
    if (!repo) {
      repo = await prisma.repository.create({
        data: {
          githubRepositoryId: "sd-repo-777",
          ownerLogin: "sdowner",
          name: "architectai-sd",
          fullName: "sdowner/architectai-sd",
          defaultBranch: "main",
          visibility: "public",
          isPrivate: false,
          language: "TypeScript",
          htmlUrl: "https://github.com/sdowner/architectai-sd",
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

    // 3. Create GraphNodes
    await prisma.graphNode.upsert({
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

  it("should generate system design with C4 diagrams and update node position", async () => {
    const genRes = await systemDesignService.generateSystemDesign(
      testUserId,
      testRepoId,
    );
    expect(genRes.systemDesignId).toBeDefined();
    expect(genRes.version).toBe(1);

    const rawDiagrams = await systemDesignService.getDiagrams(
      testUserId,
      testRepoId,
    );
    const diagrams = Array.isArray(rawDiagrams) ? rawDiagrams : [];
    expect(diagrams.length).toBe(3); // System Context, Container, Component

    const firstDiag = diagrams[0];
    expect(firstDiag.nodes.length).toBeGreaterThan(0);

    const firstNode = firstDiag.nodes[0];
    const updated = await systemDesignService.updateNodePosition(
      testUserId,
      testRepoId,
      firstDiag.id,
      firstNode.id,
      { x: 250, y: 350 },
    );
    expect(updated.x).toBe(250);
    expect(updated.y).toBe(350);
  });

  it("should format C4 system design context for RAG assistant", async () => {
    const contextText = await contextService.getSystemDesignContext(
      testUserId,
      testRepoId,
    );
    expect(contextText).toContain("C4 System Design & Architecture Overview");
    expect(contextText).toContain("C4 System Context Diagram");
  });

  it("should reject non-owner user from fetching system design (IDOR protection)", async () => {
    await expect(
      systemDesignService.getLatestSystemDesign(
        "unauthorized-user-id",
        testRepoId,
      ),
    ).rejects.toThrow();
  });
});

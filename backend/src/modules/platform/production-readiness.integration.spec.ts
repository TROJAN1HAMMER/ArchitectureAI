jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));

import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { LoggerModule } from "../../common/logger/logger.module.js";
import { HealthService } from "../health/health.service.js";
import { RepositorySyncService } from "../repository/repository-sync.service.js";
import { GithubService } from "../github/github.service.js";
import { GithubClientService } from "../github/github-client.service.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { RepositoryGraphBuilderService } from "../knowledge-graph/repository-graph-builder.service.js";
import { SemanticIndexerService } from "../semantic-search/semantic-indexer.service.js";
import { SearchableContentService } from "../semantic-search/content/searchable-content.service.js";
import { EmbeddingService } from "../semantic-search/embedding/embedding.service.js";
import { SemanticSearchService } from "../semantic-search/semantic-search.service.js";
import { MockEmbeddingProviderService } from "../semantic-search/embedding/mock-embedding-provider.service.js";
import { RagService } from "../ai/rag/rag.service.js";
import { QueryUnderstandingService } from "../ai/rag/query-understanding.service.js";
import { ContextRetrieverService } from "../ai/rag/context-retriever.service.js";
import { ContextRankerService } from "../ai/rag/context-ranker.service.js";
import { ContextBuilderService } from "../ai/rag/context-builder.service.js";
import { ConversationService } from "../ai/conversation/conversation.service.js";
import { MockLLMProviderService } from "../ai/llm/mock-llm-provider.service.js";
import { LLMProviderFactory } from "../ai/llm/llm-provider.factory.js";
import { ArchitectureDiscoveryService } from "../architecture/architecture-discovery.service.js";
import { ArchitectureAuditorService } from "../architecture/architecture-auditor.service.js";
import { ArchitecturePatternService } from "../architecture/architecture-pattern.service.js";
import { ArchitectureRiskService } from "../architecture/architecture-risk.service.js";
import { ArchitectureAnalysisService } from "../architecture/architecture-analysis.service.js";
import { ArchitectureContextService } from "../architecture/architecture-context.service.js";
import { SystemDesignDiscoveryService } from "../system-design/system-design-discovery.service.js";
import { DiagramGenerationService } from "../system-design/diagram-generation.service.js";
import { DiagramLayoutService } from "../system-design/diagram-layout.service.js";
import { SystemDesignService } from "../system-design/system-design.service.js";
import { SystemDesignContextService } from "../system-design/system-design-context.service.js";
import { ArchitectureSnapshotService } from "../governance/architecture-snapshot.service.js";
import { ArchitectureDiffService } from "../governance/architecture-diff.service.js";
import { GovernanceRuleService } from "../governance/governance-rule.service.js";
import { GovernanceEngineService } from "../governance/governance-engine.service.js";
import { GovernanceReviewService } from "../governance/governance-review.service.js";
import { GovernanceContextService } from "../governance/governance-context.service.js";
import { RemediationContextService } from "../remediation/remediation-context.service.js";
import { TopologyContextService } from "../topology/topology-context.service.js";
import { ConfigModule } from "@nestjs/config";

describe("Phase 11 Production Readiness End-to-End Integration Test", () => {
  let prisma: PrismaService;
  let healthService: HealthService;
  let graphBuilder: RepositoryGraphBuilderService;
  let semanticIndexer: SemanticIndexerService;
  let semanticSearch: SemanticSearchService;
  let ragService: RagService;
  let archAnalysis: ArchitectureAnalysisService;
  let sysDesignService: SystemDesignService;
  let governanceReview: GovernanceReviewService;

  let testUserAId: string;
  let testUserBId: string;
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
        HealthService,
        RepositorySyncService,
        GithubService,
        KnowledgeGraphService,
        RepositoryGraphBuilderService,
        SearchableContentService,
        MockEmbeddingProviderService,
        EmbeddingService,
        SemanticIndexerService,
        SemanticSearchService,
        QueryUnderstandingService,
        ContextRetrieverService,
        ContextRankerService,
        ContextBuilderService,
        ConversationService,
        MockLLMProviderService,
        LLMProviderFactory,
        RagService,
        ArchitectureDiscoveryService,
        ArchitectureAuditorService,
        ArchitecturePatternService,
        ArchitectureRiskService,
        ArchitectureAnalysisService,
        ArchitectureContextService,
        SystemDesignDiscoveryService,
        DiagramGenerationService,
        DiagramLayoutService,
        SystemDesignService,
        SystemDesignContextService,
        ArchitectureSnapshotService,
        ArchitectureDiffService,
        GovernanceRuleService,
        GovernanceEngineService,
        GovernanceReviewService,
        GovernanceContextService,
        RemediationContextService,
        TopologyContextService,
        {
          provide: GithubClientService,
          useValue: {
            getRepositoryTree: jest.fn().mockResolvedValue({
              files: [
                {
                  path: "src/index.ts",
                  name: "index.ts",
                  extension: "ts",
                  type: "blob",
                  size: 100,
                  sha: "sha-1",
                  parentPath: "src",
                },
              ],
            }),
            getRepository: jest.fn().mockResolvedValue({
              language: "TypeScript",
              stars: 10,
              forks: 2,
              isArchived: false,
            }),
          },
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    healthService = module.get<HealthService>(HealthService);
    graphBuilder = module.get<RepositoryGraphBuilderService>(
      RepositoryGraphBuilderService,
    );
    semanticIndexer = module.get<SemanticIndexerService>(
      SemanticIndexerService,
    );
    semanticSearch = module.get<SemanticSearchService>(SemanticSearchService);
    ragService = module.get<RagService>(RagService);
    archAnalysis = module.get<ArchitectureAnalysisService>(
      ArchitectureAnalysisService,
    );
    sysDesignService = module.get<SystemDesignService>(SystemDesignService);
    governanceReview = module.get<GovernanceReviewService>(
      GovernanceReviewService,
    );

    // Create User A
    let userA = await prisma.user.findFirst({
      where: { email: "user-a-prod@example.com" },
    });
    if (!userA) {
      userA = await prisma.user.create({
        data: {
          email: "user-a-prod@example.com",
          name: "User A Prod",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserAId = userA.id;

    // Create User B
    let userB = await prisma.user.findFirst({
      where: { email: "user-b-prod@example.com" },
    });
    if (!userB) {
      userB = await prisma.user.create({
        data: {
          email: "user-b-prod@example.com",
          name: "User B Prod",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserBId = userB.id;

    // Create Repository owned by User A
    let repo = await prisma.repository.findUnique({
      where: { githubRepositoryId: "prod-readiness-repo-999" },
    });
    if (!repo) {
      repo = await prisma.repository.create({
        data: {
          githubRepositoryId: "prod-readiness-repo-999",
          ownerLogin: "prodowner",
          name: "architectai-prod-readiness",
          fullName: "prodowner/architectai-prod-readiness",
          defaultBranch: "main",
          visibility: "public",
          isPrivate: false,
          language: "TypeScript",
          htmlUrl: "https://github.com/prodowner/architectai-prod-readiness",
        },
      });
    }
    testRepoId = repo.id;

    await prisma.repositoryConnection.upsert({
      where: {
        userId_repositoryId: { userId: testUserAId, repositoryId: testRepoId },
      },
      create: { userId: testUserAId, repositoryId: testRepoId },
      update: { disconnectedAt: null },
    });
  });

  afterAll(async () => {
    if (prisma) {
      if (testRepoId) {
        await prisma.repository
          .delete({ where: { id: testRepoId } })
          .catch(() => {});
      }
      if (testUserAId) {
        await prisma.user
          .delete({ where: { id: testUserAId } })
          .catch(() => {});
      }
      if (testUserBId) {
        await prisma.user
          .delete({ where: { id: testUserBId } })
          .catch(() => {});
      }
      await prisma.$disconnect();
    }
  });

  it("1. Health & readiness endpoints must pass cleanly", async () => {
    const liveness = healthService.getLiveness();
    expect(liveness.status).toBe("ok");

    const readiness = await healthService.getReadiness();
    expect(readiness.status).toBe("ok");
    expect(readiness.services.postgres).toBe("up");
    expect(readiness.services.redis).toBe("up");
  });

  it("2. Complete repository intelligence, search, AI, architecture, system design, & governance pipeline execution", async () => {
    // 1. File ingestion
    await prisma.repositoryFile.upsert({
      where: {
        repositoryId_path: { repositoryId: testRepoId, path: "src/auth.ts" },
      },
      create: {
        repositoryId: testRepoId,
        path: "src/auth.ts",
        name: "auth.ts",
        extension: "ts",
        type: "blob",
        size: 300,
        sha: "sha-1",
        parentPath: "src",
      },
      update: {},
    });

    // 2. Knowledge Graph
    const graphRes = await graphBuilder.buildGraph(testUserAId, testRepoId);
    expect(graphRes.nodesCount).toBeGreaterThan(0);

    // 3. Semantic Indexing & Search
    await semanticIndexer.indexRepository(testUserAId, testRepoId);
    const searchRes = await semanticSearch.searchRepository(
      testUserAId,
      testRepoId,
      "auth authentication",
    );
    expect(searchRes.results).toBeDefined();

    // 4. Grounded RAG Chat
    const ragRes = await ragService.processChat(
      testUserAId,
      testRepoId,
      "How is auth implemented?",
    );
    expect(ragRes.message.content).toBeDefined();

    // 5. Architecture Discovery & Audit
    const archRes = await archAnalysis.runAnalysis(testUserAId, testRepoId);
    expect(archRes.status).toBe("SUCCESS");

    // 6. System Design Studio C4 Generation
    const sysRes = await sysDesignService.generateSystemDesign(
      testUserAId,
      testRepoId,
    );
    expect(sysRes.systemDesignId).toBeDefined();

    // 7. Architecture Governance Review & Snapshot
    const govRes = await governanceReview.runGovernanceReview(
      testUserAId,
      testRepoId,
    );
    expect(govRes.reviewStatus).toBeDefined();
  });

  it("3. IDOR Isolation: User B cannot access User A repository resources", async () => {
    await expect(
      semanticSearch.searchRepository(testUserBId, testRepoId, "auth"),
    ).rejects.toThrow();

    await expect(
      ragService.processChat(testUserBId, testRepoId, "test query"),
    ).rejects.toThrow();

    await expect(
      archAnalysis.getLatestSummary(testUserBId, testRepoId),
    ).rejects.toThrow();

    await expect(
      sysDesignService.getLatestSystemDesign(testUserBId, testRepoId),
    ).rejects.toThrow();

    await expect(
      governanceReview.getGovernanceSummary(testUserBId, testRepoId),
    ).rejects.toThrow();
  });
});

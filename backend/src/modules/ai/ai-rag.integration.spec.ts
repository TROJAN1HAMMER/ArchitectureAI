import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { LoggerModule } from "../../common/logger/logger.module.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { RepositoryGraphBuilderService } from "../knowledge-graph/repository-graph-builder.service.js";
import { EmbeddingService } from "../semantic-search/embedding/embedding.service.js";
import { MockEmbeddingProviderService } from "../semantic-search/embedding/mock-embedding-provider.service.js";
import { SearchableContentService } from "../semantic-search/content/searchable-content.service.js";
import { SemanticIndexerService } from "../semantic-search/semantic-indexer.service.js";
import { SemanticSearchService } from "../semantic-search/semantic-search.service.js";
import { RagService } from "./rag/rag.service.js";
import { QueryUnderstandingService } from "./rag/query-understanding.service.js";
import { ContextRetrieverService } from "./rag/context-retriever.service.js";
import { ContextRankerService } from "./rag/context-ranker.service.js";
import { ContextBuilderService } from "./rag/context-builder.service.js";
import { ConversationService } from "./conversation/conversation.service.js";
import { MockLLMProviderService } from "./llm/mock-llm-provider.service.js";
import { LLMProviderFactory } from "./llm/llm-provider.factory.js";
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
import { GovernanceRuleService } from "../governance/governance-rule.service.js";
import { GovernanceEngineService } from "../governance/governance-engine.service.js";
import { ArchitectureSnapshotService } from "../governance/architecture-snapshot.service.js";
import { ArchitectureDiffService } from "../governance/architecture-diff.service.js";
import { GovernanceReviewService } from "../governance/governance-review.service.js";
import { GovernanceContextService } from "../governance/governance-context.service.js";
import { RemediationContextService } from "../remediation/remediation-context.service.js";
import { ConfigModule } from "@nestjs/config";

describe("Phase 7 AI Repository RAG Integration Test", () => {
  let prisma: PrismaService;
  let ragService: RagService;
  let conversationService: ConversationService;
  let semanticIndexer: SemanticIndexerService;
  let graphBuilder: RepositoryGraphBuilderService;

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
      imports: [
        LoggerModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              EMBEDDING_PROVIDER: "mock",
              EMBEDDING_MODEL: "text-embedding-3-small",
              EMBEDDING_DIMENSIONS: 1536,
              EMBEDDING_MAX_FILE_SIZE: 524288,
              EMBEDDING_CHUNK_SIZE: 1000,
              EMBEDDING_CHUNK_OVERLAP: 200,
              LLM_PROVIDER: "mock",
              LLM_MODEL: "mock-model",
              MAX_CONTEXT_CHARS: 8000,
            }),
          ],
        }),
      ],
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
        MockEmbeddingProviderService,
        EmbeddingService,
        SearchableContentService,
        SemanticIndexerService,
        SemanticSearchService,
        QueryUnderstandingService,
        ContextRetrieverService,
        ContextRankerService,
        ContextBuilderService,
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
        GovernanceRuleService,
        GovernanceEngineService,
        ArchitectureDiffService,
        ArchitectureSnapshotService,
        GovernanceReviewService,
        GovernanceContextService,
        RemediationContextService,
        MockLLMProviderService,
        LLMProviderFactory,
        ConversationService,
        RagService,
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    ragService = module.get<RagService>(RagService);
    conversationService = module.get<ConversationService>(ConversationService);
    semanticIndexer = module.get<SemanticIndexerService>(
      SemanticIndexerService,
    );
    graphBuilder = module.get<RepositoryGraphBuilderService>(
      RepositoryGraphBuilderService,
    );

    // 1. Create test user
    let user = await prisma.user.findFirst({
      where: { email: "rag-user@example.com" },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "rag-user@example.com",
          name: "RAG User",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserId = user.id;

    // 2. Create test repository
    let repo = await prisma.repository.findUnique({
      where: { githubRepositoryId: "rag-repo-999" },
    });
    if (!repo) {
      repo = await prisma.repository.create({
        data: {
          githubRepositoryId: "rag-repo-999",
          ownerLogin: "ragowner",
          name: "architectai-rag",
          fullName: "ragowner/architectai-rag",
          defaultBranch: "main",
          visibility: "public",
          isPrivate: false,
          language: "TypeScript",
          htmlUrl: "https://github.com/ragowner/architectai-rag",
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

    // 3. Populate RepositoryFile records
    const testFiles = [
      {
        path: "src/auth/auth.service.ts",
        name: "auth.service.ts",
        extension: "ts",
        type: "blob",
        size: 450,
        sha: "sha-auth",
        parentPath: "src/auth",
      },
      {
        path: "src/auth/jwt.strategy.ts",
        name: "jwt.strategy.ts",
        extension: "ts",
        type: "blob",
        size: 300,
        sha: "sha-jwt",
        parentPath: "src/auth",
      },
      {
        path: "README.md",
        name: "README.md",
        extension: "md",
        type: "blob",
        size: 200,
        sha: "sha-readme",
        parentPath: null,
      },
    ];

    for (const f of testFiles) {
      await prisma.repositoryFile.upsert({
        where: {
          repositoryId_path: { repositoryId: testRepoId, path: f.path },
        },
        create: { repositoryId: testRepoId, ...f },
        update: f,
      });
    }

    // 4. Build Knowledge Graph and Semantic Embeddings
    await graphBuilder.buildGraph(testUserId, testRepoId);
    await semanticIndexer.indexRepository(testUserId, testRepoId);
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

  it("should process RAG chat request, perform semantic+graph retrieval, and return grounded answer with sources", async () => {
    const res = await ragService.processChat(
      testUserId,
      testRepoId,
      "How does authentication work?",
    );
    expect(res.conversationId).toBeDefined();
    expect(res.message.role).toBe("ASSISTANT");
    expect(res.message.content).toContain("src/auth/auth.service.ts");
    expect(res.sources.length).toBeGreaterThan(0);
    expect(res.meta.provider).toBe("mock");
  });

  it("should support ongoing conversation history using conversationId", async () => {
    const chat1 = await ragService.processChat(
      testUserId,
      testRepoId,
      "Explain JWT validation",
    );
    const chat2 = await ragService.processChat(
      testUserId,
      testRepoId,
      "What file implements this strategy?",
      chat1.conversationId,
    );

    expect(chat2.conversationId).toBe(chat1.conversationId);
    const conv = await conversationService.getConversation(
      testUserId,
      chat1.conversationId,
    );
    expect(conv.messages.length).toBe(4); // 2 user messages + 2 assistant messages
  });

  it("should reject unauthorized user from accessing conversation (IDOR prevention)", async () => {
    const chat = await ragService.processChat(
      testUserId,
      testRepoId,
      "Initial prompt",
    );
    await expect(
      conversationService.getConversation(
        "unauthorized-user-id",
        chat.conversationId,
      ),
    ).rejects.toThrow();
  });
});

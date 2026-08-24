import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { LoggerModule } from "../../common/logger/logger.module.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { RepositoryGraphBuilderService } from "../knowledge-graph/repository-graph-builder.service.js";
import { EmbeddingService } from "./embedding/embedding.service.js";
import { MockEmbeddingProviderService } from "./embedding/mock-embedding-provider.service.js";
import { SearchableContentService } from "./content/searchable-content.service.js";
import { SemanticIndexerService } from "./semantic-indexer.service.js";
import { SemanticSearchService } from "./semantic-search.service.js";
import { ConfigModule } from "@nestjs/config";

describe("Phase 6 End-to-End Live Database Pipeline Audit", () => {
  let prisma: PrismaService;
  let semanticIndexer: SemanticIndexerService;
  let semanticSearch: SemanticSearchService;
  let graphBuilder: RepositoryGraphBuilderService;

  let testUserId: string;
  let testRepoId: string;

  beforeAll(async () => {
    const mockRedisStore = new Map<string, string>();
    const mockRedisClient = {
      set: jest.fn().mockImplementation(async (key: string, val: string) => {
        mockRedisStore.set(key, val);
        return "OK";
      }),
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
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    semanticIndexer = module.get<SemanticIndexerService>(
      SemanticIndexerService,
    );
    semanticSearch = module.get<SemanticSearchService>(SemanticSearchService);
    graphBuilder = module.get<RepositoryGraphBuilderService>(
      RepositoryGraphBuilderService,
    );

    // 1. Create or fetch test user
    let user = await prisma.user.findFirst({
      where: { email: "audit-user@example.com" },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "audit-user@example.com",
          name: "Audit User",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserId = user.id;

    // 2. Create test repository & connection
    let repo = await prisma.repository.findUnique({
      where: { githubRepositoryId: "audit-repo-999" },
    });
    if (!repo) {
      repo = await prisma.repository.create({
        data: {
          githubRepositoryId: "audit-repo-999",
          ownerLogin: "auditowner",
          name: "architectai-audit",
          fullName: "auditowner/architectai-audit",
          defaultBranch: "main",
          visibility: "public",
          isPrivate: false,
          language: "TypeScript",
          htmlUrl: "https://github.com/auditowner/architectai-audit",
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
        path: "src/main.ts",
        name: "main.ts",
        extension: "ts",
        type: "blob",
        size: 120,
        sha: "sha-1",
        parentPath: "src",
      },
      {
        path: "src/auth/auth.service.ts",
        name: "auth.service.ts",
        extension: "ts",
        type: "blob",
        size: 450,
        sha: "sha-2",
        parentPath: "src/auth",
      },
      {
        path: "src/auth/auth.middleware.ts",
        name: "auth.middleware.ts",
        extension: "ts",
        type: "blob",
        size: 300,
        sha: "sha-3",
        parentPath: "src/auth",
      },
      {
        path: "src/database/schema.prisma",
        name: "schema.prisma",
        extension: "prisma",
        type: "blob",
        size: 800,
        sha: "sha-4",
        parentPath: "src/database",
      },
      {
        path: "README.md",
        name: "README.md",
        extension: "md",
        type: "blob",
        size: 200,
        sha: "sha-5",
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

  it("should build Knowledge Graph and produce GraphNode & GraphEdge records in live Postgres", async () => {
    const graphResult = await graphBuilder.buildGraph(testUserId, testRepoId);
    expect(graphResult.status).toBe("SUCCESS");
    expect(graphResult.nodesCount).toBeGreaterThan(0);

    const nodesCount = await prisma.graphNode.count({
      where: { repositoryId: testRepoId },
    });
    const edgesCount = await prisma.graphEdge.count({
      where: { repositoryId: testRepoId },
    });
    expect(nodesCount).toBe(graphResult.nodesCount);
    expect(edgesCount).toBe(graphResult.edgesCount);
  });

  it("should index repository files and persist Embedding & SemanticIndex records in live Postgres", async () => {
    const indexResult1 = await semanticIndexer.indexRepository(
      testUserId,
      testRepoId,
    );
    expect(indexResult1.status).toBe("SUCCESS");
    expect(indexResult1.filesDiscovered).toBe(5);
    expect(indexResult1.filesProcessed).toBe(5);

    const embeddingsCount = await prisma.embedding.count({
      where: { repositoryId: testRepoId },
    });
    expect(embeddingsCount).toBeGreaterThan(0);
  });

  it("should skip unchanged content on second run via content hashing (idempotency)", async () => {
    const indexResult2 = await semanticIndexer.indexRepository(
      testUserId,
      testRepoId,
    );
    expect(indexResult2.status).toBe("SUCCESS");
    expect(indexResult2.filesSkipped).toBe(5);
    expect(indexResult2.filesProcessed).toBe(0);
  });

  it("should remove stale embeddings when a repository file is deleted", async () => {
    // Delete one file
    await prisma.repositoryFile.delete({
      where: {
        repositoryId_path: { repositoryId: testRepoId, path: "README.md" },
      },
    });

    const indexResult3 = await semanticIndexer.indexRepository(
      testUserId,
      testRepoId,
    );
    expect(indexResult3.filesDiscovered).toBe(4);

    const readmeEmbedding = await prisma.embedding.findFirst({
      where: {
        repositoryId: testRepoId,
        content: { contains: "Path: README.md" },
      },
    });
    expect(readmeEmbedding).toBeNull();
  });

  it("should execute semantic search and return ranked results for query", async () => {
    const searchRes = await semanticSearch.searchRepository(
      testUserId,
      testRepoId,
      "authentication middleware JWT",
      5,
    );
    expect(searchRes.query).toBe("authentication middleware JWT");
    expect(searchRes.results.length).toBeGreaterThan(0);
    expect(searchRes.results[0].score).toBeGreaterThan(0.5);
  });

  it("should reject non-owner user from searching (IDOR prevention)", async () => {
    await expect(
      semanticSearch.searchRepository(
        "non-existent-user-id",
        testRepoId,
        "auth",
        5,
      ),
    ).rejects.toThrow();
  });
});

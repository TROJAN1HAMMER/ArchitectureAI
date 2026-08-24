import { Test, TestingModule } from "@nestjs/testing";
import { SemanticIndexerService } from "./semantic-indexer.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { EmbeddingService } from "./embedding/embedding.service.js";
import { SearchableContentService } from "./content/searchable-content.service.js";
import { ConflictException } from "@nestjs/common";

describe("SemanticIndexerService Unit Tests", () => {
  let service: SemanticIndexerService;

  const mockRedisClient = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    repositoryConnection: {
      findUnique: jest.fn(),
    },
    repository: {
      findUnique: jest.fn(),
    },
    repositoryFile: {
      findMany: jest.fn(),
    },
    semanticIndex: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    embedding: {
      count: jest.fn(),
    },
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  const mockEmbeddingService = {
    isContentAlreadyEmbedded: jest.fn(),
    persistEmbedding: jest.fn(),
    removeStaleEmbeddings: jest.fn(),
  };

  const mockSearchableContentService = {
    isSupportedFile: jest.fn().mockReturnValue(true),
    generateSearchableChunks: jest.fn().mockReturnValue([
      {
        chunkIndex: 0,
        totalChunks: 1,
        inputContent: "formatted text",
        contentHash: "hash-123",
        metadata: {},
      },
    ]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemanticIndexerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
        {
          provide: SearchableContentService,
          useValue: mockSearchableContentService,
        },
      ],
    }).compile();

    service = module.get<SemanticIndexerService>(SemanticIndexerService);
  });

  it("should throw ConflictException if Redis lock is already held", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-1",
    });
    mockPrismaService.repository.findUnique.mockResolvedValue({
      id: "repo-1",
      fullName: "owner/repo",
    });
    mockRedisClient.set.mockResolvedValue(null); // Lock fails

    await expect(service.indexRepository("user-1", "repo-1")).rejects.toThrow(
      ConflictException,
    );
  });

  it("should index repository files and release Redis lock", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-1",
    });
    mockPrismaService.repository.findUnique.mockResolvedValue({
      id: "repo-1",
      fullName: "owner/repo",
      language: "TypeScript",
    });
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.get.mockImplementation(async () => {
      return mockRedisClient.set.mock.calls[0][1];
    });

    mockPrismaService.semanticIndex.create.mockResolvedValue({ id: "idx-1" });
    mockPrismaService.repositoryFile.findMany.mockResolvedValue([
      { id: "f1", path: "src/auth.ts", size: 100, type: "blob" },
    ]);
    mockEmbeddingService.isContentAlreadyEmbedded.mockResolvedValue(false);

    const result = await service.indexRepository("user-1", "repo-1");

    expect(result.status).toBe("SUCCESS");
    expect(result.filesDiscovered).toBe(1);
    expect(result.filesProcessed).toBe(1);
    expect(mockEmbeddingService.persistEmbedding).toHaveBeenCalled();
    expect(mockRedisClient.del).toHaveBeenCalled();
  });
});

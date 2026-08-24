import { Test, TestingModule } from "@nestjs/testing";
import { EmbeddingService } from "./embedding.service.js";
import { MockEmbeddingProviderService } from "./mock-embedding-provider.service.js";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { ConfigService } from "@nestjs/config";

describe("EmbeddingService Unit Tests", () => {
  let service: EmbeddingService;

  const mockPrismaService = {
    embedding: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === "EMBEDDING_MODEL") return "text-embedding-3-small";
      if (key === "EMBEDDING_DIMENSIONS") return 1536;
      return null;
    }),
  };

  const mockProvider = {
    generateEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0.1)),
    generateEmbeddings: jest
      .fn()
      .mockResolvedValue([new Array(1536).fill(0.1)]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MockEmbeddingProviderService, useValue: mockProvider },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
  });

  it("should generate embedding vector matching configured dimensions", async () => {
    const vector = await service.generateEmbedding("auth service code");
    expect(vector.length).toBe(1536);
    expect(mockProvider.generateEmbedding).toHaveBeenCalledWith(
      "auth service code",
    );
  });

  it("should detect if content is already embedded via contentHash lookup", async () => {
    mockPrismaService.embedding.findFirst.mockResolvedValue({ id: "emb-1" });

    const isEmbedded = await service.isContentAlreadyEmbedded(
      "repo-1",
      "file-1",
      0,
      "hash-123",
    );

    expect(isEmbedded).toBe(true);
    expect(mockPrismaService.embedding.findFirst).toHaveBeenCalledWith({
      where: {
        repositoryId: "repo-1",
        fileId: "file-1",
        chunkIndex: 0,
        model: "text-embedding-3-small",
        contentHash: "hash-123",
      },
    });
  });

  it("should upsert embedding record", async () => {
    mockPrismaService.embedding.upsert.mockResolvedValue({ id: "emb-100" });

    const result = await service.persistEmbedding({
      repositoryId: "repo-1",
      fileId: "file-1",
      contentHash: "hash-123",
      content: "test content",
    });

    expect(result.id).toBe("emb-100");
    expect(mockPrismaService.embedding.upsert).toHaveBeenCalled();
  });
});

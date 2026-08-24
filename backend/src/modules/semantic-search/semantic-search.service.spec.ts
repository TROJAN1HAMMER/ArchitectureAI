import { Test, TestingModule } from "@nestjs/testing";
import { SemanticSearchService } from "./semantic-search.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { EmbeddingService } from "./embedding/embedding.service.js";
import { SemanticIndexerService } from "./semantic-indexer.service.js";

describe("SemanticSearchService Unit Tests", () => {
  let service: SemanticSearchService;

  const mockPrismaService = {
    embedding: {
      findMany: jest.fn(),
    },
  };

  const mockEmbeddingService = {
    generateEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0.1)),
  };

  const mockSemanticIndexerService = {
    verifyRepositoryOwnership: jest.fn().mockResolvedValue({ id: "conn-1" }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SemanticSearchService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
        {
          provide: SemanticIndexerService,
          useValue: mockSemanticIndexerService,
        },
      ],
    }).compile();

    service = module.get<SemanticSearchService>(SemanticSearchService);
  });

  it("should generate query embedding and return ranked search results", async () => {
    mockPrismaService.embedding.findMany.mockResolvedValue([
      {
        id: "emb-1",
        fileId: "file-1",
        content:
          "Repository: repo\nPath: backend/src/auth.ts\n\nauth middleware code",
        metadata: { language: "TypeScript" },
        file: { path: "backend/src/auth.ts" },
      },
    ]);

    const res = await service.searchRepository(
      "user-1",
      "repo-1",
      "authentication middleware",
      10,
    );

    expect(res.query).toBe("authentication middleware");
    expect(res.results.length).toBe(1);
    expect(res.results[0].path).toBe("backend/src/auth.ts");
    expect(res.results[0].score).toBeGreaterThan(0);
    expect(
      mockSemanticIndexerService.verifyRepositoryOwnership,
    ).toHaveBeenCalledWith("user-1", "repo-1");
  });
});

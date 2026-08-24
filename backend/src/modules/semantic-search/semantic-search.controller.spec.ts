import { Test, TestingModule } from "@nestjs/testing";
import { SemanticSearchController } from "./semantic-search.controller.js";
import { SemanticSearchService } from "./semantic-search.service.js";
import { SemanticIndexerService } from "./semantic-indexer.service.js";
import { BadRequestException } from "@nestjs/common";

describe("SemanticSearchController Unit Tests", () => {
  let controller: SemanticSearchController;

  const mockSemanticSearchService = {
    searchRepository: jest.fn().mockResolvedValue({
      query: "auth",
      results: [],
    }),
  };

  const mockSemanticIndexerService = {
    getIndexingStatus: jest.fn().mockResolvedValue({ status: "SUCCESS" }),
    indexRepository: jest.fn().mockResolvedValue({
      repositoryId: "repo-1",
      status: "SUCCESS",
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SemanticSearchController],
      providers: [
        { provide: SemanticSearchService, useValue: mockSemanticSearchService },
        {
          provide: SemanticIndexerService,
          useValue: mockSemanticIndexerService,
        },
      ],
    }).compile();

    controller = module.get<SemanticSearchController>(SemanticSearchController);
  });

  it("should throw BadRequestException if query param q is missing", async () => {
    await expect(controller.search("user-1", "repo-1", "")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should return search results for valid query", async () => {
    const res = await controller.search("user-1", "repo-1", "auth", "5");
    expect(res.query).toBe("auth");
    expect(mockSemanticSearchService.searchRepository).toHaveBeenCalledWith(
      "user-1",
      "repo-1",
      "auth",
      5,
    );
  });

  it("should trigger semantic indexing", async () => {
    const res = await controller.triggerIndexing("user-1", "repo-1");
    expect(res.status).toBe("RUNNING");
    expect(mockSemanticIndexerService.indexRepository).toHaveBeenCalledWith(
      "user-1",
      "repo-1",
    );
  });
});

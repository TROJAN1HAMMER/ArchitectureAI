import { Test, TestingModule } from "@nestjs/testing";
import { ContextRetrieverService } from "./context-retriever.service.js";
import { SemanticSearchService } from "../../semantic-search/semantic-search.service.js";
import { KnowledgeGraphService } from "../../knowledge-graph/knowledge-graph.service.js";
import { SemanticIndexerService } from "../../semantic-search/semantic-indexer.service.js";

describe("ContextRetrieverService Unit Tests", () => {
  let service: ContextRetrieverService;

  const mockSemanticSearchService = {
    searchRepository: jest.fn().mockResolvedValue({
      results: [
        {
          fileId: "f1",
          path: "src/auth.ts",
          score: 0.9,
          content: "auth content",
          metadata: {},
        },
      ],
    }),
  };

  const mockKnowledgeGraphService = {
    getNodes: jest.fn().mockResolvedValue({
      nodes: [{ id: "n1", name: "auth.ts" }],
    }),
    getNeighborhood: jest.fn().mockResolvedValue({
      connectedNodes: [{ name: "user.service.ts", type: "FILE" }],
    }),
  };

  const mockSemanticIndexerService = {
    verifyRepositoryOwnership: jest.fn().mockResolvedValue({ id: "conn-1" }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextRetrieverService,
        { provide: SemanticSearchService, useValue: mockSemanticSearchService },
        { provide: KnowledgeGraphService, useValue: mockKnowledgeGraphService },
        {
          provide: SemanticIndexerService,
          useValue: mockSemanticIndexerService,
        },
      ],
    }).compile();

    service = module.get<ContextRetrieverService>(ContextRetrieverService);
  });

  it("should verify ownership and return combined semantic and graph context", async () => {
    const candidates = await service.retrieveContext("user-1", "repo-1", {
      normalizedQuery: "auth",
      keywords: ["auth"],
      intent: "security",
      likelyNodeTypes: [],
      likelyEdgeTypes: [],
    });

    expect(
      mockSemanticIndexerService.verifyRepositoryOwnership,
    ).toHaveBeenCalledWith("user-1", "repo-1");
    expect(candidates.length).toBe(1);
    expect(candidates[0].path).toBe("src/auth.ts");
    expect(candidates[0].graphConnections.length).toBe(1);
  });
});

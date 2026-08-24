import { Test, TestingModule } from "@nestjs/testing";
import { ContextRankerService } from "./context-ranker.service.js";

describe("ContextRankerService Unit Tests", () => {
  let service: ContextRankerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContextRankerService],
    }).compile();

    service = module.get<ContextRankerService>(ContextRankerService);
  });

  it("should calculate multi-signal score and rank candidates", () => {
    const candidates = [
      {
        fileId: "f1",
        path: "src/database.ts",
        content: "db connection code",
        semanticScore: 0.7,
        graphConnections: [],
        metadata: {},
      },
      {
        fileId: "f2",
        path: "src/auth/auth.service.ts",
        content: "auth token code",
        semanticScore: 0.9,
        graphConnections: [{ nodeName: "jwt.strategy.ts", type: "IMPORTS" }],
        metadata: {},
      },
    ];

    const ranked = service.rankContext(candidates, {
      normalizedQuery: "auth service",
      keywords: ["auth", "service"],
      intent: "security",
      likelyNodeTypes: [],
      likelyEdgeTypes: [],
    });

    expect(ranked.length).toBe(2);
    expect(ranked[0].path).toBe("src/auth/auth.service.ts");
    expect(ranked[0].finalScore).toBeGreaterThan(ranked[1].finalScore);
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { QueryUnderstandingService } from "./query-understanding.service.js";

describe("QueryUnderstandingService Unit Tests", () => {
  let service: QueryUnderstandingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryUnderstandingService],
    }).compile();

    service = module.get<QueryUnderstandingService>(QueryUnderstandingService);
  });

  it("should classify authentication query intent as security", () => {
    const res = service.parseQuery(
      "How does authentication and JWT validation work?",
    );
    expect(res.intent).toBe("security");
    expect(res.keywords).toContain("authentication");
    expect(res.keywords).toContain("validation");
  });

  it("should classify architecture overview query intent as architecture", () => {
    const res = service.parseQuery(
      "Show the system architecture and module topology",
    );
    expect(res.intent).toBe("architecture");
    expect(res.keywords).toContain("architecture");
  });
});

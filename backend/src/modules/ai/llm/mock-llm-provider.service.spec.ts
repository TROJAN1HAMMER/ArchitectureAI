import { Test, TestingModule } from "@nestjs/testing";
import { MockLLMProviderService } from "./mock-llm-provider.service.js";
import { ConfigService } from "@nestjs/config";

describe("MockLLMProviderService Unit Tests", () => {
  let service: MockLLMProviderService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === "LLM_MODEL") return "mock-model";
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockLLMProviderService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MockLLMProviderService>(MockLLMProviderService);
  });

  it("should produce a fallback message if context is empty", async () => {
    const res = await service.generate({
      systemPrompt: "system",
      userPrompt: "How does auth work?",
      context: "",
    });

    expect(res.provider).toBe("mock");
    expect(res.content).toContain("couldn't find enough relevant evidence");
  });

  it("should extract path references and format grounded response when context is provided", async () => {
    const context = `[Source 1]\nPath: src/auth/auth.service.ts\nRelevance Score: 0.95\n\nconst auth = true;`;
    const res = await service.generate({
      systemPrompt: "system",
      userPrompt: "How does auth work?",
      context,
    });

    expect(res.provider).toBe("mock");
    expect(res.content).toContain("src/auth/auth.service.ts");
    expect(res.content).toContain("Based on the repository context retrieved");
  });
});

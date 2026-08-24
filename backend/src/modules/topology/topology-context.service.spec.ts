import { Test, TestingModule } from "@nestjs/testing";
import { TopologyContextService } from "./topology-context.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";

describe("TopologyContextService Unit Tests", () => {
  let service: TopologyContextService;

  const mockPrismaService = {
    repository: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopologyContextService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TopologyContextService>(TopologyContextService);
  });

  it("should return empty string if query is unrelated to topology", async () => {
    const context = await service.getTopologyContext(
      "repo-1",
      "How do I format a date?",
    );
    expect(context).toBe("");
  });

  it("should return formatted topology context block when query is enterprise related", async () => {
    mockPrismaService.repository.findUnique.mockResolvedValue({
      id: "repo-1",
      enterpriseSystem: {
        name: "Acme Platform",
        description: "Enterprise system",
        repositories: [
          {
            id: "repo-1",
            name: "auth-service",
            role: "SERVICE",
            language: "TypeScript",
          },
          {
            id: "repo-2",
            name: "user-service",
            role: "SERVICE",
            language: "Go",
          },
        ],
        dependencies: [
          {
            type: "HTTP_CALL",
            confidence: "HIGH",
            sourceRepository: { name: "user-service" },
            targetRepository: { name: "auth-service" },
          },
        ],
        analyses: [{ riskScore: 15, riskLevel: "LOW" }],
        findings: [],
      },
    });

    const context = await service.getTopologyContext(
      "repo-1",
      "Which repositories depend on auth-service?",
    );
    expect(context).toContain("Acme Platform");
    expect(context).toContain("user-service --[HTTP_CALL]--> auth-service");
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { TopologyDiscoveryService } from "./topology-discovery.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RepositoryRole } from "@prisma/client";

describe("TopologyDiscoveryService Unit Tests", () => {
  let service: TopologyDiscoveryService;

  const mockPrismaService = {
    repository: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopologyDiscoveryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TopologyDiscoveryService>(TopologyDiscoveryService);
  });

  it("should infer FRONTEND role for nextjs repo", async () => {
    mockPrismaService.repository.findUnique.mockResolvedValue({
      id: "repo-ui",
      name: "frontend-web",
      files: [{ path: "next.config.js", name: "next.config.js" }],
    });

    const role = await service.inferRepositoryRole("repo-ui");
    expect(role).toBe(RepositoryRole.FRONTEND);
  });

  it("should discover HTTP_CALL dependency between Frontend and Service repos", async () => {
    mockPrismaService.repository.findMany.mockResolvedValue([
      {
        id: "repo-web",
        name: "web-ui",
        role: RepositoryRole.FRONTEND,
        files: [],
        graphNodes: [],
        graphEdges: [],
      },
      {
        id: "repo-api",
        name: "payment-api",
        role: RepositoryRole.SERVICE,
        files: [],
        graphNodes: [],
        graphEdges: [],
      },
    ]);

    const discovered = await service.discoverDependencies("sys-1");
    expect(discovered.length).toBeGreaterThan(0);
    expect(discovered[0].sourceRepositoryId).toBe("repo-web");
    expect(discovered[0].targetRepositoryId).toBe("repo-api");
  });
});

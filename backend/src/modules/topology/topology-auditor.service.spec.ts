import { Test, TestingModule } from "@nestjs/testing";
import { TopologyAuditorService } from "./topology-auditor.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { EnterpriseFindingType, RepositoryRole } from "@prisma/client";

describe("TopologyAuditorService Unit Tests", () => {
  let service: TopologyAuditorService;

  const mockPrismaService = {
    repository: {
      findMany: jest.fn(),
    },
    repositoryDependency: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopologyAuditorService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TopologyAuditorService>(TopologyAuditorService);
  });

  it("should detect CIRCULAR_SERVICE_DEPENDENCY when Repo A and Repo B depend on each other", async () => {
    mockPrismaService.repository.findMany.mockResolvedValue([
      { id: "repo-a", name: "Service A", role: RepositoryRole.SERVICE },
      { id: "repo-b", name: "Service B", role: RepositoryRole.SERVICE },
    ]);

    mockPrismaService.repositoryDependency.findMany.mockResolvedValue([
      {
        id: "dep-1",
        enterpriseSystemId: "sys-1",
        sourceRepositoryId: "repo-a",
        targetRepositoryId: "repo-b",
        type: "HTTP_CALL",
        sourceRepository: {
          id: "repo-a",
          name: "Service A",
          role: RepositoryRole.SERVICE,
        },
        targetRepository: {
          id: "repo-b",
          name: "Service B",
          role: RepositoryRole.SERVICE,
        },
      },
      {
        id: "dep-2",
        enterpriseSystemId: "sys-1",
        sourceRepositoryId: "repo-b",
        targetRepositoryId: "repo-a",
        type: "HTTP_CALL",
        sourceRepository: {
          id: "repo-b",
          name: "Service B",
          role: RepositoryRole.SERVICE,
        },
        targetRepository: {
          id: "repo-a",
          name: "Service A",
          role: RepositoryRole.SERVICE,
        },
      },
    ]);

    const findings = await service.auditTopology("sys-1");
    const cycleFinding = findings.find(
      (f) => f.type === EnterpriseFindingType.CIRCULAR_SERVICE_DEPENDENCY,
    );

    expect(cycleFinding).toBeDefined();
    expect(cycleFinding?.title).toContain("Circular dependency");
  });
});

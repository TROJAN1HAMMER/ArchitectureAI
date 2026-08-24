import { Test, TestingModule } from "@nestjs/testing";
import { TopologyAnalysisService } from "./topology-analysis.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisLockService } from "../../common/redis/redis-lock.service.js";
import { EnterpriseSystemService } from "./enterprise-system.service.js";
import { TopologyDiscoveryService } from "./topology-discovery.service.js";
import { TopologyAuditorService } from "./topology-auditor.service.js";
import { TopologyRiskService } from "./topology-risk.service.js";
import { RepositoryDependencyService } from "./repository-dependency.service.js";
import { EnterpriseTopologyStatus } from "@prisma/client";

describe("TopologyAnalysisService Unit Tests", () => {
  let service: TopologyAnalysisService;

  const mockPrismaService = {
    enterpriseSystem: {
      findUnique: jest.fn(),
    },
    enterpriseTopologyAnalysis: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    enterpriseTopologyFinding: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockRedisLockService = {
    runWithLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => fn()),
  };

  const mockEnterpriseSystemService = {
    verifySystemOwnership: jest.fn(),
  };

  const mockDiscoveryService = {
    discoverDependencies: jest.fn().mockResolvedValue([]),
  };

  const mockAuditorService = {
    auditTopology: jest.fn().mockResolvedValue([]),
  };

  const mockRiskService = {
    calculateRiskScore: jest.fn().mockReturnValue({
      riskScore: 10,
      riskLevel: "LOW",
      factorBreakdown: {},
    }),
  };

  const mockDependencyService = {
    createOrUpdateDependency: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopologyAnalysisService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisLockService, useValue: mockRedisLockService },
        {
          provide: EnterpriseSystemService,
          useValue: mockEnterpriseSystemService,
        },
        { provide: TopologyDiscoveryService, useValue: mockDiscoveryService },
        { provide: TopologyAuditorService, useValue: mockAuditorService },
        { provide: TopologyRiskService, useValue: mockRiskService },
        {
          provide: RepositoryDependencyService,
          useValue: mockDependencyService,
        },
      ],
    }).compile();

    service = module.get<TopologyAnalysisService>(TopologyAnalysisService);
  });

  it("should run analysis and return completed analysis record", async () => {
    mockPrismaService.enterpriseSystem.findUnique.mockResolvedValue({
      id: "sys-123",
      repositories: [{ id: "r1" }, { id: "r2" }],
    });
    mockPrismaService.enterpriseTopologyAnalysis.create.mockResolvedValue({
      id: "analysis-1",
      enterpriseSystemId: "sys-123",
      status: EnterpriseTopologyStatus.RUNNING,
    });
    mockPrismaService.enterpriseTopologyFinding.deleteMany.mockResolvedValue({
      count: 0,
    });
    mockPrismaService.enterpriseTopologyAnalysis.update.mockResolvedValue({
      id: "analysis-1",
      enterpriseSystemId: "sys-123",
      status: EnterpriseTopologyStatus.SUCCESS,
      riskScore: 10,
      riskLevel: "LOW",
    });

    const res = await service.analyzeTopology("user-1", "sys-123");

    expect(res.status).toBe(EnterpriseTopologyStatus.SUCCESS);
    expect(
      mockEnterpriseSystemService.verifySystemOwnership,
    ).toHaveBeenCalledWith("user-1", "sys-123");
  });
});

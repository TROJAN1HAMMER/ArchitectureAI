import { Test, TestingModule } from "@nestjs/testing";
import { EnterpriseTopologyController } from "./enterprise-topology.controller.js";
import { EnterpriseSystemService } from "./enterprise-system.service.js";
import { TopologyAnalysisService } from "./topology-analysis.service.js";
import { RepositoryDependencyService } from "./repository-dependency.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";

describe("EnterpriseTopologyController Unit Tests", () => {
  let controller: EnterpriseTopologyController;

  const mockSystemService = {
    listSystems: jest.fn().mockResolvedValue([]),
    createSystem: jest.fn().mockResolvedValue({ id: "sys-1" }),
    getSystem: jest.fn().mockResolvedValue({ id: "sys-1" }),
    updateSystem: jest.fn().mockResolvedValue({ id: "sys-1" }),
    deleteSystem: jest.fn().mockResolvedValue({ success: true }),
    addRepositoryToSystem: jest.fn().mockResolvedValue({ id: "repo-1" }),
    removeRepositoryFromSystem: jest.fn().mockResolvedValue({ id: "repo-1" }),
    verifySystemOwnership: jest.fn(),
  };

  const mockAnalysisService = {
    analyzeTopology: jest.fn().mockResolvedValue({ status: "SUCCESS" }),
    getAnalysisHistory: jest.fn().mockResolvedValue([]),
  };

  const mockDependencyService = {
    getDependenciesForSystem: jest.fn().mockResolvedValue([]),
  };

  const mockPrismaService = {
    enterpriseSystem: { findUnique: jest.fn() },
    enterpriseTopologyFinding: { findMany: jest.fn(), findFirst: jest.fn() },
    repository: { findMany: jest.fn(), findFirst: jest.fn() },
    repositoryDependency: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterpriseTopologyController],
      providers: [
        { provide: EnterpriseSystemService, useValue: mockSystemService },
        { provide: TopologyAnalysisService, useValue: mockAnalysisService },
        {
          provide: RepositoryDependencyService,
          useValue: mockDependencyService,
        },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<EnterpriseTopologyController>(
      EnterpriseTopologyController,
    );
  });

  it("should list systems for user", async () => {
    const res = await controller.listSystems("user-1");
    expect(res).toEqual([]);
    expect(mockSystemService.listSystems).toHaveBeenCalledWith("user-1");
  });

  it("should analyze topology for system", async () => {
    const res = await controller.analyzeTopology("user-1", "sys-1");
    expect(res).toEqual({ status: "SUCCESS" });
    expect(mockAnalysisService.analyzeTopology).toHaveBeenCalledWith(
      "user-1",
      "sys-1",
    );
  });
});

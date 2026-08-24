import { Test, TestingModule } from "@nestjs/testing";
import { ArchitectureAnalysisService } from "./architecture-analysis.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { ArchitectureDiscoveryService } from "./architecture-discovery.service.js";
import { ArchitectureAuditorService } from "./architecture-auditor.service.js";
import { ArchitecturePatternService } from "./architecture-pattern.service.js";
import { ArchitectureRiskService } from "./architecture-risk.service.js";
import { ConflictException } from "@nestjs/common";

describe("ArchitectureAnalysisService Unit Tests", () => {
  let service: ArchitectureAnalysisService;

  const mockRedisClient = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    architectureAnalysis: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    graphNode: { findMany: jest.fn().mockResolvedValue([]) },
    graphEdge: { findMany: jest.fn().mockResolvedValue([]) },
    architectureFinding: { create: jest.fn() },
  };

  const mockKnowledgeGraphService = {
    verifyRepositoryOwnership: jest.fn().mockResolvedValue({ id: "conn-1" }),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchitectureAnalysisService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: KnowledgeGraphService, useValue: mockKnowledgeGraphService },
        ArchitectureDiscoveryService,
        ArchitectureAuditorService,
        ArchitecturePatternService,
        ArchitectureRiskService,
      ],
    }).compile();

    service = module.get<ArchitectureAnalysisService>(
      ArchitectureAnalysisService,
    );
  });

  it("should throw ConflictException if Redis architecture lock is already held", async () => {
    mockRedisClient.set.mockResolvedValue(null); // Lock acquisition fails

    await expect(service.runAnalysis("user-1", "repo-1")).rejects.toThrow(
      ConflictException,
    );
  });

  it("should complete analysis and release Redis lock", async () => {
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.get.mockImplementation(async () => {
      return mockRedisClient.set.mock.calls[0][1];
    });

    mockPrismaService.architectureAnalysis.create.mockResolvedValue({
      id: "analysis-1",
    });
    mockPrismaService.architectureAnalysis.update.mockResolvedValue({
      id: "analysis-1",
      status: "SUCCESS",
      riskScore: 0,
      riskLevel: "LOW",
      findingsGenerated: 0,
    });

    const res = await service.runAnalysis("user-1", "repo-1");
    expect(res.analysisId).toBe("analysis-1");
    expect(mockRedisClient.del).toHaveBeenCalled();
  });
});

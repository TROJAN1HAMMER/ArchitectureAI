import { Test, TestingModule } from "@nestjs/testing";
import { GovernanceReviewService } from "./governance-review.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { ArchitectureSnapshotService } from "./architecture-snapshot.service.js";
import { ArchitectureDiffService } from "./architecture-diff.service.js";
import { GovernanceRuleService } from "./governance-rule.service.js";
import { GovernanceEngineService } from "./governance-engine.service.js";
import { ConflictException } from "@nestjs/common";

describe("GovernanceReviewService Unit Tests", () => {
  let service: GovernanceReviewService;

  const mockRedisClient = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    architectureSnapshot: {
      findFirst: jest.fn(),
    },
    governanceViolation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    architectureDiff: {
      findFirst: jest.fn(),
    },
  };

  const mockKnowledgeGraphService = {
    verifyRepositoryOwnership: jest.fn().mockResolvedValue({ id: "conn-1" }),
  };

  const mockSnapshotService = {
    createSnapshot: jest.fn().mockResolvedValue({
      id: "snap-2",
      version: 2,
      riskScore: 10.0,
      architectureAnalysis: null,
    }),
    getLatestSnapshot: jest
      .fn()
      .mockResolvedValue({ version: 2, riskScore: 10.0 }),
  };

  const mockDiffService = {
    compareSnapshots: jest
      .fn()
      .mockResolvedValue({ id: "diff-1", riskDelta: 0.0 }),
    listDiffs: jest.fn().mockResolvedValue([]),
  };

  const mockRuleService = {
    listRules: jest.fn().mockResolvedValue([]),
  };

  const mockEngineService = {
    evaluateRules: jest.fn().mockReturnValue([]),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceReviewService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: KnowledgeGraphService, useValue: mockKnowledgeGraphService },
        { provide: ArchitectureSnapshotService, useValue: mockSnapshotService },
        { provide: ArchitectureDiffService, useValue: mockDiffService },
        { provide: GovernanceRuleService, useValue: mockRuleService },
        { provide: GovernanceEngineService, useValue: mockEngineService },
      ],
    }).compile();

    service = module.get<GovernanceReviewService>(GovernanceReviewService);
  });

  it("should throw ConflictException if Redis governance lock is already held", async () => {
    mockRedisClient.set.mockResolvedValue(null);

    await expect(
      service.runGovernanceReview("user-1", "repo-1"),
    ).rejects.toThrow(ConflictException);
  });

  it("should run governance review, create snapshot, and release Redis lock", async () => {
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.get.mockImplementation(async () => {
      return mockRedisClient.set.mock.calls[0][1];
    });

    const res = await service.runGovernanceReview("user-1", "repo-1");
    expect(res.reviewStatus).toBe("PASS");
    expect(mockRedisClient.del).toHaveBeenCalled();
  });
});

jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));

import { Test, TestingModule } from "@nestjs/testing";
import { RemediationService } from "./remediation.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisLockService } from "../../common/redis/redis-lock.service.js";
import { RemediationPlannerService } from "./remediation-planner.service.js";
import { RemediationGeneratorService } from "./remediation-generator.service.js";
import { RemediationValidatorService } from "./remediation-validator.service.js";
import { RemediationExecutorService } from "./remediation-executor.service.js";
import { ForbiddenException } from "@nestjs/common";

describe("RemediationService Unit Tests", () => {
  let service: RemediationService;

  const mockPrismaService = {
    repositoryConnection: {
      findFirst: jest.fn(),
    },
    remediationPlan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockRedisLockService = {
    runWithLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => fn()),
  };

  const mockPlanner = { createPlanForFinding: jest.fn() };
  const mockGenerator = { generatePatchesForPlan: jest.fn() };
  const mockValidator = { validateRemediationPlan: jest.fn() };
  const mockExecutor = { executeRemediationPlan: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemediationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisLockService, useValue: mockRedisLockService },
        { provide: RemediationPlannerService, useValue: mockPlanner },
        { provide: RemediationGeneratorService, useValue: mockGenerator },
        { provide: RemediationValidatorService, useValue: mockValidator },
        { provide: RemediationExecutorService, useValue: mockExecutor },
      ],
    }).compile();

    service = module.get<RemediationService>(RemediationService);
  });

  it("should throw ForbiddenException if user does not own repository connection", async () => {
    mockPrismaService.repositoryConnection.findFirst.mockResolvedValue(null);

    await expect(
      service.listRemediations("unauthorized-user", "repo-123"),
    ).rejects.toThrow(ForbiddenException);
  });

  it("should list remediations when repository ownership check passes", async () => {
    mockPrismaService.repositoryConnection.findFirst.mockResolvedValue({
      id: "conn-1",
    });
    mockPrismaService.remediationPlan.findMany.mockResolvedValue([
      { id: "plan-1" },
    ]);

    const res = await service.listRemediations("user-1", "repo-123");
    expect(res).toEqual([{ id: "plan-1" }]);
  });
});

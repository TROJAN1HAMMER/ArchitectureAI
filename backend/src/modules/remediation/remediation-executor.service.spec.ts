jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));

import { Test, TestingModule } from "@nestjs/testing";
import { RemediationExecutorService } from "./remediation-executor.service.js";
import { RemediationSafetyService } from "./remediation-safety.service.js";
import { GithubClientService } from "../github/github-client.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RemediationStatus, RemediationType } from "@prisma/client";
import { BadRequestException } from "@nestjs/common";

describe("RemediationExecutorService Unit Tests", () => {
  let service: RemediationExecutorService;

  const mockPrismaService = {
    remediationPlan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    remediationExecution: {
      create: jest.fn(),
    },
  };

  const mockGithubClient = {
    createPullRequest: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemediationExecutorService,
        RemediationSafetyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GithubClientService, useValue: mockGithubClient },
      ],
    }).compile();

    service = module.get<RemediationExecutorService>(
      RemediationExecutorService,
    );
  });

  it("should throw BadRequestException if plan status is not READY", async () => {
    mockPrismaService.remediationPlan.findFirst.mockResolvedValue({
      id: "plan-123",
      repositoryId: "repo-123",
      status: RemediationStatus.PROPOSED,
    });

    await expect(
      service.executeRemediationPlan("repo-123", "plan-123"),
    ).rejects.toThrow(BadRequestException);
  });

  it("should create branch and PR without performing automatic merge", async () => {
    const mockPlan = {
      id: "plan-456",
      repositoryId: "repo-123",
      type: RemediationType.CIRCULAR_DEPENDENCY_FIX,
      status: RemediationStatus.READY,
      riskLevel: "LOW",
      title: "Fix cycle between A and B",
      description: "Invert type import",
      rationale: "Decouple cycle",
      affectedFiles: ["src/a.ts"],
      patches: [],
      validations: [],
    };

    mockPrismaService.remediationPlan.findFirst.mockResolvedValue(mockPlan);
    mockPrismaService.remediationExecution.create.mockResolvedValue({
      id: "exec-1",
      branchName: "architectai/remediation/circular_dependency_fix-plan-456",
      pullRequestNumber: 101,
      pullRequestUrl: "https://github.com/prodowner/architectai/pull/101",
      status: "PR_CREATED",
    });
    mockPrismaService.remediationPlan.update.mockResolvedValue({
      ...mockPlan,
      status: RemediationStatus.APPLIED,
    });

    const res = await service.executeRemediationPlan("repo-123", "plan-456");

    expect(res.execution.status).toBe("PR_CREATED");
    expect(res.pullRequestUrl).toBeDefined();
    // Human Approval Boundary verification: no auto-merge call exists anywhere
    expect((res.execution as any).merged).toBeUndefined();
  });
});

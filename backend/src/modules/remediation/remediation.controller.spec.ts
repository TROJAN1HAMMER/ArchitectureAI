jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));

import { Test, TestingModule } from "@nestjs/testing";
import { RemediationController } from "./remediation.controller.js";
import { RemediationService } from "./remediation.service.js";

describe("RemediationController Unit Tests", () => {
  let controller: RemediationController;

  const mockRemediationService = {
    listRemediations: jest.fn().mockResolvedValue([]),
    createPlan: jest.fn().mockResolvedValue({ id: "plan-1" }),
    getRemediation: jest.fn().mockResolvedValue({ id: "plan-1" }),
    generatePatches: jest.fn().mockResolvedValue({ patches: [] }),
    validatePlan: jest.fn().mockResolvedValue({ passed: true }),
    executePlan: jest
      .fn()
      .mockResolvedValue({ pullRequestUrl: "https://github.com/pr/1" }),
    deletePlan: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemediationController],
      providers: [
        { provide: RemediationService, useValue: mockRemediationService },
      ],
    }).compile();

    controller = module.get<RemediationController>(RemediationController);
  });

  it("should list remediation plans for repository", async () => {
    const result = await controller.listRemediations("user-1", "repo-1");
    expect(result).toBeDefined();
    expect(mockRemediationService.listRemediations).toHaveBeenCalledWith(
      "user-1",
      "repo-1",
    );
  });

  it("should create remediation plan from finding", async () => {
    const result = await controller.createPlan("user-1", "repo-1", {
      findingId: "finding-1",
    });
    expect(result).toEqual({ id: "plan-1" });
    expect(mockRemediationService.createPlan).toHaveBeenCalledWith(
      "user-1",
      "repo-1",
      "finding-1",
    );
  });

  it("should generate patches", async () => {
    const result = await controller.generatePatches(
      "user-1",
      "repo-1",
      "plan-1",
    );
    expect(result).toEqual({ patches: [] });
    expect(mockRemediationService.generatePatches).toHaveBeenCalledWith(
      "user-1",
      "repo-1",
      "plan-1",
    );
  });

  it("should execute plan (create PR) without merging", async () => {
    const result = await controller.executePlan("user-1", "repo-1", "plan-1");
    expect(result).toEqual({ pullRequestUrl: "https://github.com/pr/1" });
    expect(mockRemediationService.executePlan).toHaveBeenCalledWith(
      "user-1",
      "repo-1",
      "plan-1",
    );
  });
});

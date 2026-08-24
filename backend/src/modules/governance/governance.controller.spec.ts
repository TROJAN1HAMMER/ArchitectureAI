import { Test, TestingModule } from "@nestjs/testing";
import { GovernanceController } from "./governance.controller.js";
import { GovernanceReviewService } from "./governance-review.service.js";
import { ArchitectureSnapshotService } from "./architecture-snapshot.service.js";
import { ArchitectureDiffService } from "./architecture-diff.service.js";
import { GovernanceRuleService } from "./governance-rule.service.js";

describe("GovernanceController Unit Tests", () => {
  let controller: GovernanceController;

  const mockReviewService = {
    getGovernanceSummary: jest.fn().mockResolvedValue({ reviewStatus: "PASS" }),
    runGovernanceReview: jest.fn().mockResolvedValue({ reviewStatus: "PASS" }),
    listViolations: jest.fn().mockResolvedValue([]),
    updateViolationStatus: jest
      .fn()
      .mockResolvedValue({ id: "v-1", status: "ACKNOWLEDGED" }),
  };

  const mockSnapshotService = {
    listSnapshots: jest.fn().mockResolvedValue([]),
    getSnapshot: jest.fn().mockResolvedValue({ id: "snap-1" }),
  };

  const mockDiffService = {
    listDiffs: jest.fn().mockResolvedValue([]),
    getDiffDetail: jest.fn().mockResolvedValue({ id: "diff-1" }),
  };

  const mockRuleService = {
    listRules: jest.fn().mockResolvedValue([]),
    createRule: jest.fn().mockResolvedValue({ id: "rule-1" }),
    updateRule: jest.fn().mockResolvedValue({ id: "rule-1" }),
    deleteRule: jest.fn().mockResolvedValue({ id: "rule-1" }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GovernanceController],
      providers: [
        { provide: GovernanceReviewService, useValue: mockReviewService },
        { provide: ArchitectureSnapshotService, useValue: mockSnapshotService },
        { provide: ArchitectureDiffService, useValue: mockDiffService },
        { provide: GovernanceRuleService, useValue: mockRuleService },
      ],
    }).compile();

    controller = module.get<GovernanceController>(GovernanceController);
  });

  it("should return governance summary via GET", async () => {
    const res = await controller.getSummary("user-1", "repo-1");
    expect(res.reviewStatus).toBe("PASS");
  });

  it("should trigger governance review via POST", async () => {
    const res = await controller.runReview("user-1", "repo-1");
    expect(res.reviewStatus).toBe("PASS");
  });
});

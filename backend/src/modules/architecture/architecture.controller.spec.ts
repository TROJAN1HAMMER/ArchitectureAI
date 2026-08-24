import { Test, TestingModule } from "@nestjs/testing";
import { ArchitectureController } from "./architecture.controller.js";
import { ArchitectureAnalysisService } from "./architecture-analysis.service.js";

describe("ArchitectureController Unit Tests", () => {
  let controller: ArchitectureController;

  const mockAnalysisService = {
    getLatestSummary: jest.fn().mockResolvedValue({ status: "SUCCESS" }),
    runAnalysis: jest
      .fn()
      .mockResolvedValue({ analysisId: "a1", status: "RUNNING" }),
    getFindings: jest.fn().mockResolvedValue({ findings: [] }),
    getFindingDetail: jest.fn().mockResolvedValue({ id: "f1" }),
    getComponents: jest.fn().mockResolvedValue({ components: [] }),
    getHistory: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArchitectureController],
      providers: [
        { provide: ArchitectureAnalysisService, useValue: mockAnalysisService },
      ],
    }).compile();

    controller = module.get<ArchitectureController>(ArchitectureController);
  });

  it("should trigger analysis via POST analyze", async () => {
    const res = await controller.analyze("user-1", "repo-1");
    expect(res.analysisId).toBe("a1");
    expect(mockAnalysisService.runAnalysis).toHaveBeenCalledWith(
      "user-1",
      "repo-1",
    );
  });

  it("should fetch summary via GET", async () => {
    const res = await controller.getSummary("user-1", "repo-1");
    expect(res.status).toBe("SUCCESS");
  });
});

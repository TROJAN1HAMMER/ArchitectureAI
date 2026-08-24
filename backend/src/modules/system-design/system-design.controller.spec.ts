import { Test, TestingModule } from "@nestjs/testing";
import { SystemDesignController } from "./system-design.controller.js";
import { SystemDesignService } from "./system-design.service.js";

describe("SystemDesignController Unit Tests", () => {
  let controller: SystemDesignController;

  const mockSystemDesignService = {
    getLatestSystemDesign: jest.fn().mockResolvedValue({ status: "SUCCESS" }),
    generateSystemDesign: jest
      .fn()
      .mockResolvedValue({ systemDesignId: "sd-1" }),
    getDiagrams: jest.fn().mockResolvedValue([]),
    getDiagramDetail: jest.fn().mockResolvedValue({ id: "d-1" }),
    updateNodePosition: jest
      .fn()
      .mockResolvedValue({ id: "n-1", x: 10, y: 20 }),
    resetLayout: jest.fn().mockResolvedValue({ success: true }),
    deleteSystemDesign: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemDesignController],
      providers: [
        { provide: SystemDesignService, useValue: mockSystemDesignService },
      ],
    }).compile();

    controller = module.get<SystemDesignController>(SystemDesignController);
  });

  it("should trigger system design generation via POST", async () => {
    const res = await controller.generate("user-1", "repo-1");
    expect(res.systemDesignId).toBe("sd-1");
    expect(mockSystemDesignService.generateSystemDesign).toHaveBeenCalledWith(
      "user-1",
      "repo-1",
    );
  });

  it("should update node position via PATCH", async () => {
    const res = await controller.updateNodePosition(
      "user-1",
      "repo-1",
      "d-1",
      "n-1",
      { x: 10, y: 20 },
    );
    expect(res.id).toBe("n-1");
  });
});

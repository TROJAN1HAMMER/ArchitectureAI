import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller.js";
import { HealthService } from "./health.service.js";

describe("HealthController Unit Tests", () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            getLiveness: jest.fn(() => ({ status: "ok" })),
            getReadiness: jest.fn(() => ({
              status: "ok",
              checks: { database: "ok", redis: "ok" },
            })),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it("should return live check successfully", () => {
    const result = controller.getLive();
    expect(result).toEqual({ status: "ok" });
    expect(service.getLiveness).toHaveBeenCalled();
  });

  it("should return ready check successfully", async () => {
    const result = await controller.getReady();
    expect(result).toEqual({
      status: "ok",
      checks: { database: "ok", redis: "ok" },
    });
    expect(service.getReadiness).toHaveBeenCalled();
  });
});

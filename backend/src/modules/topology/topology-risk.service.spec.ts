import { Test, TestingModule } from "@nestjs/testing";
import { TopologyRiskService } from "./topology-risk.service.js";
import {
  EnterpriseFindingType,
  EnterpriseFindingSeverity,
} from "@prisma/client";

describe("TopologyRiskService Unit Tests", () => {
  let service: TopologyRiskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TopologyRiskService],
    }).compile();

    service = module.get<TopologyRiskService>(TopologyRiskService);
  });

  it("should calculate LOW risk for zero findings", () => {
    const res = service.calculateRiskScore([]);
    expect(res.riskScore).toBe(0);
    expect(res.riskLevel).toBe("LOW");
  });

  it("should calculate CRITICAL risk when multiple severe findings exist", () => {
    const findings = [
      {
        type: EnterpriseFindingType.CIRCULAR_SERVICE_DEPENDENCY,
        severity: EnterpriseFindingSeverity.CRITICAL,
        title: "Cycle A-B",
        description: "Cycle",
        confidence: 1.0,
      },
      {
        type: EnterpriseFindingType.SINGLE_POINT_OF_FAILURE,
        severity: EnterpriseFindingSeverity.CRITICAL,
        title: "SPOF Core",
        description: "SPOF",
        confidence: 1.0,
      },
      {
        type: EnterpriseFindingType.CROSS_BOUNDARY_DEPENDENCY,
        severity: EnterpriseFindingSeverity.CRITICAL,
        title: "Cross boundary",
        description: "UI to DB",
        confidence: 1.0,
      },
      {
        type: EnterpriseFindingType.HIGH_SERVICE_COUPLING,
        severity: EnterpriseFindingSeverity.HIGH,
        title: "High coupling",
        description: "Coupling",
        confidence: 1.0,
      },
    ];

    const res = service.calculateRiskScore(findings);
    expect(res.riskScore).toBeGreaterThanOrEqual(60);
    expect(res.riskLevel).toBe("HIGH");
    expect(res.factorBreakdown.circularDependenciesPenalty).toBe(20);
  });
});

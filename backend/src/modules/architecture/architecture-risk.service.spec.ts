import { Test, TestingModule } from "@nestjs/testing";
import { ArchitectureRiskService } from "./architecture-risk.service.js";
import {
  ArchitectureFindingSeverity,
  ArchitectureFindingType,
} from "@prisma/client";

describe("ArchitectureRiskService Unit Tests", () => {
  let service: ArchitectureRiskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchitectureRiskService],
    }).compile();

    service = module.get<ArchitectureRiskService>(ArchitectureRiskService);
  });

  it("should calculate score 0 for empty findings", () => {
    const res = service.calculateRiskScore([]);
    expect(res.score).toBe(0);
    expect(res.level).toBe("LOW");
  });

  it("should calculate elevated risk score for boundary violations and cycles", () => {
    const findings = [
      {
        type: ArchitectureFindingType.BOUNDARY_VIOLATION,
        severity: ArchitectureFindingSeverity.CRITICAL,
        title: "Frontend imports backend",
        description: "violation",
        confidence: 0.95,
      },
      {
        type: ArchitectureFindingType.CIRCULAR_DEPENDENCY,
        severity: ArchitectureFindingSeverity.HIGH,
        title: "Cycle",
        description: "cycle",
        confidence: 0.9,
      },
    ];

    const res = service.calculateRiskScore(findings);
    expect(res.score).toBeGreaterThan(40);
    expect(res.level).toBe("ELEVATED");
  });
});

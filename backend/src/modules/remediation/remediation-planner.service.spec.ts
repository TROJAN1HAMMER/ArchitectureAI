import { Test, TestingModule } from "@nestjs/testing";
import { RemediationPlannerService } from "./remediation-planner.service.js";
import { RemediationSafetyService } from "./remediation-safety.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  ArchitectureFindingType,
  RemediationType,
  RemediationRiskLevel,
} from "@prisma/client";

describe("RemediationPlannerService Unit Tests", () => {
  let service: RemediationPlannerService;

  const mockPrismaService = {
    architectureFinding: {
      findFirst: jest.fn(),
    },
    remediationPlan: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemediationPlannerService,
        RemediationSafetyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RemediationPlannerService>(RemediationPlannerService);
  });

  it("should plan AUTO_REMEDIABLE fix for CIRCULAR_DEPENDENCY finding", () => {
    const finding = {
      type: ArchitectureFindingType.CIRCULAR_DEPENDENCY,
      title: "Circular dependency between A and B",
      sourceNode: { path: "src/a.ts" },
      targetNode: { path: "src/b.ts" },
    };

    const plan = service.planRemediation(finding);

    expect(plan.type).toBe(RemediationType.CIRCULAR_DEPENDENCY_FIX);
    expect(plan.classification).toBe("AUTO_REMEDIABLE");
    expect(plan.riskLevel).toBe(RemediationRiskLevel.LOW);
    expect(plan.affectedFiles).toContain("src/a.ts");
    expect(plan.affectedFiles).toContain("src/b.ts");
  });

  it("should plan ASSISTED_REMEDIATION for BOUNDARY_VIOLATION finding", () => {
    const finding = {
      type: ArchitectureFindingType.BOUNDARY_VIOLATION,
      title: "Frontend direct DB access",
      sourceNode: { path: "src/ui/Component.tsx" },
      targetNode: { path: "src/db/client.ts" },
    };

    const plan = service.planRemediation(finding);

    expect(plan.type).toBe(RemediationType.BOUNDARY_VIOLATION_FIX);
    expect(plan.classification).toBe("ASSISTED_REMEDIATION");
    expect(plan.riskLevel).toBe(RemediationRiskLevel.MEDIUM);
  });

  it("should plan MANUAL_ONLY for LARGE_COMPONENT finding", () => {
    const finding = {
      type: ArchitectureFindingType.LARGE_COMPONENT,
      title: "Excessively large component Monolith.ts",
      sourceNode: { path: "src/Monolith.ts" },
    };

    const plan = service.planRemediation(finding);

    expect(plan.type).toBe(RemediationType.LARGE_COMPONENT_REFACTOR);
    expect(plan.classification).toBe("MANUAL_ONLY");
    expect(plan.riskLevel).toBe(RemediationRiskLevel.HIGH);
  });
});

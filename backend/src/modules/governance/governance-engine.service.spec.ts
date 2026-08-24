import { Test, TestingModule } from "@nestjs/testing";
import { GovernanceEngineService } from "./governance-engine.service.js";
import { GovernanceRule, GovernanceRuleSeverity } from "@prisma/client";

describe("GovernanceEngineService Unit Tests", () => {
  let service: GovernanceEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GovernanceEngineService],
    }).compile();

    service = module.get<GovernanceEngineService>(GovernanceEngineService);
  });

  it("should evaluate rules against analysis findings and detect violations", () => {
    const rules: GovernanceRule[] = [
      {
        id: "r1",
        repositoryId: null,
        name: "No Circular Dependencies",
        description: "Rule 1",
        ruleType: "NO_CIRCULAR_DEPENDENCY",
        severity: GovernanceRuleSeverity.CRITICAL,
        enabled: true,
        configuration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const analysis = {
      findings: [
        {
          type: "CIRCULAR_DEPENDENCY",
          title: "Cycle A -> B -> A",
          description: "Circular import between A and B",
          sourceNodeId: "n1",
          targetNodeId: "n2",
        },
      ],
      riskScore: 25.0,
    };

    const violations = service.evaluateRules(rules, analysis);
    expect(violations.length).toBe(1);
    expect(violations[0].ruleId).toBe("r1");
    expect(violations[0].severity).toBe("CRITICAL");
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { GovernanceRuleService } from "./governance-rule.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";

describe("GovernanceRuleService Unit Tests", () => {
  let service: GovernanceRuleService;

  const mockPrismaService = {
    governanceRule: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockResolvedValue({ id: "rule-1", name: "Custom Rule" }),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ id: "rule-1", enabled: false }),
      delete: jest.fn().mockResolvedValue({ id: "rule-1" }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceRuleService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GovernanceRuleService>(GovernanceRuleService);
  });

  it("should seed default rules on module init", async () => {
    await service.onModuleInit();
    expect(mockPrismaService.governanceRule.create).toHaveBeenCalled();
  });
});

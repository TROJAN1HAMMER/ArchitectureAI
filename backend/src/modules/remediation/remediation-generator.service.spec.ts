import { Test, TestingModule } from "@nestjs/testing";
import { RemediationGeneratorService } from "./remediation-generator.service.js";
import { RemediationSafetyService } from "./remediation-safety.service.js";
import { MockRefactoringProviderService } from "./refactoring/mock-refactoring-provider.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RemediationType, RemediationStatus } from "@prisma/client";

describe("RemediationGeneratorService Unit Tests", () => {
  let service: RemediationGeneratorService;

  const mockPrismaService = {
    remediationPlan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    repository: {
      findUnique: jest.fn(),
    },
    remediationPatch: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemediationGeneratorService,
        RemediationSafetyService,
        MockRefactoringProviderService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RemediationGeneratorService>(
      RemediationGeneratorService,
    );
  });

  it("should generate patches and unified diff for valid remediation plan", async () => {
    const mockPlan = {
      id: "plan-123",
      repositoryId: "repo-123",
      type: RemediationType.CIRCULAR_DEPENDENCY_FIX,
      affectedFiles: ["src/a.ts"],
      status: RemediationStatus.PROPOSED,
    };

    mockPrismaService.remediationPlan.findFirst.mockResolvedValue(mockPlan);
    mockPrismaService.repository.findUnique.mockResolvedValue({
      id: "repo-123",
    });
    mockPrismaService.remediationPatch.deleteMany.mockResolvedValue({
      count: 0,
    });
    mockPrismaService.remediationPatch.create.mockResolvedValue({
      id: "patch-1",
      remediationId: "plan-123",
      filePath: "src/a.ts",
      diff: "--- a/src/a.ts\n+++ b/src/a.ts",
    });
    mockPrismaService.remediationPlan.update.mockResolvedValue({
      ...mockPlan,
      status: RemediationStatus.PROPOSED,
    });

    const result = await service.generatePatchesForPlan("repo-123", "plan-123");

    expect(result.patches).toHaveLength(1);
    expect(mockPrismaService.remediationPatch.create).toHaveBeenCalled();
  });
});

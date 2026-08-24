import { Test, TestingModule } from "@nestjs/testing";
import { RepositoryDependencyService } from "./repository-dependency.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { BadRequestException } from "@nestjs/common";
import { RepositoryDependencyType, DependencyConfidence } from "@prisma/client";

describe("RepositoryDependencyService Unit Tests", () => {
  let service: RepositoryDependencyService;

  const mockPrismaService = {
    repositoryDependency: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoryDependencyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RepositoryDependencyService>(
      RepositoryDependencyService,
    );
  });

  it("should throw BadRequestException if source and target repo are identical", async () => {
    await expect(
      service.createOrUpdateDependency({
        enterpriseSystemId: "sys-1",
        sourceRepositoryId: "repo-1",
        targetRepositoryId: "repo-1",
        type: RepositoryDependencyType.IMPORTS,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("should upsert repository dependency when repositories are distinct", async () => {
    mockPrismaService.repositoryDependency.upsert.mockResolvedValue({
      id: "dep-1",
      sourceRepositoryId: "repo-1",
      targetRepositoryId: "repo-2",
      type: RepositoryDependencyType.HTTP_CALL,
    });

    const res = await service.createOrUpdateDependency({
      enterpriseSystemId: "sys-1",
      sourceRepositoryId: "repo-1",
      targetRepositoryId: "repo-2",
      type: RepositoryDependencyType.HTTP_CALL,
      confidence: DependencyConfidence.HIGH,
    });

    expect(res.id).toBe("dep-1");
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { EnterpriseSystemService } from "./enterprise-system.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { NotFoundException } from "@nestjs/common";

describe("EnterpriseSystemService Unit Tests", () => {
  let service: EnterpriseSystemService;

  const mockPrismaService = {
    enterpriseSystem: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    repositoryConnection: {
      findFirst: jest.fn(),
    },
    repository: {
      update: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterpriseSystemService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EnterpriseSystemService>(EnterpriseSystemService);
  });

  it("should throw NotFoundException if user does not own enterprise system", async () => {
    mockPrismaService.enterpriseSystem.findFirst.mockResolvedValue(null);

    await expect(
      service.verifySystemOwnership("user-1", "sys-99"),
    ).rejects.toThrow(NotFoundException);
  });

  it("should create enterprise system for user", async () => {
    mockPrismaService.enterpriseSystem.create.mockResolvedValue({
      id: "sys-1",
      name: "E-Commerce System",
      userId: "user-1",
    });
    mockPrismaService.enterpriseSystem.findFirst.mockResolvedValue({
      id: "sys-1",
      userId: "user-1",
    });
    mockPrismaService.enterpriseSystem.findUnique.mockResolvedValue({
      id: "sys-1",
      name: "E-Commerce System",
      repositories: [],
      dependencies: [],
      analyses: [],
      findings: [],
    });

    const result = await service.createSystem("user-1", {
      name: "E-Commerce System",
    });
    expect(result.id).toBe("sys-1");
  });
});

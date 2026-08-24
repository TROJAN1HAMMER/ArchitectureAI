import { Test, TestingModule } from "@nestjs/testing";
import { ArchitectureDiffService } from "./architecture-diff.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";

describe("ArchitectureDiffService Unit Tests", () => {
  let service: ArchitectureDiffService;

  const mockPrismaService = {
    architectureSnapshot: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === "snap-1") {
          return Promise.resolve({
            id: "snap-1",
            version: 1,
            riskScore: 20.0,
            nodes: [
              { qualifiedName: "src/auth.ts", name: "auth.ts", type: "FILE" },
            ],
            edges: [],
          });
        }
        return Promise.resolve({
          id: "snap-2",
          version: 2,
          riskScore: 35.0,
          nodes: [
            { qualifiedName: "src/auth.ts", name: "auth.ts", type: "FILE" },
            { qualifiedName: "src/user.ts", name: "user.ts", type: "FILE" },
          ],
          edges: [
            {
              sourceQualifiedName: "src/auth.ts",
              targetQualifiedName: "src/user.ts",
              type: "IMPORTS",
            },
          ],
        });
      }),
    },
    architectureDiff: {
      create: jest.fn().mockResolvedValue({ id: "diff-1" }),
      findUnique: jest.fn().mockResolvedValue({ id: "diff-1", items: [] }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    architectureDiffItem: {
      create: jest.fn().mockResolvedValue({ id: "item-1" }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchitectureDiffService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ArchitectureDiffService>(ArchitectureDiffService);
  });

  it("should compare two snapshots and compute risk delta & added components", async () => {
    const diff = await service.compareSnapshots("repo-1", "snap-1", "snap-2");
    expect(diff?.id).toBe("diff-1");
    expect(mockPrismaService.architectureDiff.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        riskDelta: 15.0,
      }),
    });
    expect(mockPrismaService.architectureDiffItem.create).toHaveBeenCalled();
  });
});

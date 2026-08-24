import { Test, TestingModule } from "@nestjs/testing";
import { ArchitectureSnapshotService } from "./architecture-snapshot.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";

describe("ArchitectureSnapshotService Unit Tests", () => {
  let service: ArchitectureSnapshotService;

  const mockPrismaService = {
    architectureAnalysis: {
      findFirst: jest.fn().mockResolvedValue({
        id: "analysis-1",
        nodesAnalyzed: 10,
        findingsGenerated: 2,
        riskScore: 25.0,
        riskLevel: "MODERATE",
      }),
    },
    systemDesign: {
      findFirst: jest.fn().mockResolvedValue({ id: "sd-1", version: 1 }),
    },
    graphNode: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "gn-1",
          qualifiedName: "src/auth.ts",
          type: "FILE",
          name: "auth.ts",
          path: "src/auth.ts",
          metadata: null,
        },
      ]),
    },
    graphEdge: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    architectureSnapshot: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: "snap-1",
        version: 1,
        label: "Initial Snapshot",
      }),
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: "snap-1", version: 1, nodes: [], edges: [] }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    architectureSnapshotNode: {
      create: jest.fn().mockResolvedValue({ id: "sn-1" }),
    },
    architectureSnapshotEdge: {
      create: jest.fn().mockResolvedValue({ id: "se-1" }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchitectureSnapshotService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ArchitectureSnapshotService>(
      ArchitectureSnapshotService,
    );
  });

  it("should create deterministic architecture snapshot", async () => {
    const res = await service.createSnapshot("repo-1", "Review Snapshot");
    expect(res?.id).toBe("snap-1");
    expect(mockPrismaService.architectureSnapshot.create).toHaveBeenCalled();
    expect(
      mockPrismaService.architectureSnapshotNode.create,
    ).toHaveBeenCalled();
  });
});

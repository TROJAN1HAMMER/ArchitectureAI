import { Test, TestingModule } from "@nestjs/testing";
import { KnowledgeGraphService } from "./knowledge-graph.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { NodeType, EdgeType } from "@prisma/client";
import { NotFoundException } from "@nestjs/common";

describe("KnowledgeGraphService Unit Tests", () => {
  let service: KnowledgeGraphService;

  const mockPrismaService = {
    repositoryConnection: {
      findUnique: jest.fn(),
    },
    graphNode: {
      upsert: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    graphEdge: {
      upsert: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeGraphService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<KnowledgeGraphService>(KnowledgeGraphService);
  });

  it("should throw NotFoundException if repository connection does not exist or is disconnected", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue(null);

    await expect(
      service.getGraphSummary("user-123", "repo-123"),
    ).rejects.toThrow(NotFoundException);
  });

  it("should upsert a graph node correctly", async () => {
    mockPrismaService.graphNode.upsert.mockResolvedValue({
      id: "node-1",
      qualifiedName: "file:repo-123:src/index.ts",
    });

    const result = await service.upsertNode({
      repositoryId: "repo-123",
      qualifiedName: "file:repo-123:src/index.ts",
      name: "index.ts",
      type: NodeType.FILE,
    });

    expect(result.id).toBe("node-1");
    expect(mockPrismaService.graphNode.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          repositoryId_qualifiedName: {
            repositoryId: "repo-123",
            qualifiedName: "file:repo-123:src/index.ts",
          },
        },
      }),
    );
  });

  it("should upsert a graph edge correctly", async () => {
    mockPrismaService.graphEdge.upsert.mockResolvedValue({
      id: "edge-1",
      type: EdgeType.CONTAINS,
    });

    const result = await service.upsertEdge({
      repositoryId: "repo-123",
      sourceNodeId: "node-1",
      targetNodeId: "node-2",
      type: EdgeType.CONTAINS,
    });

    expect(result.id).toBe("edge-1");
    expect(mockPrismaService.graphEdge.upsert).toHaveBeenCalled();
  });

  it("should return graph summary statistics for authorized user", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-123",
    });
    mockPrismaService.graphNode.count.mockResolvedValue(25);
    mockPrismaService.graphEdge.count.mockResolvedValue(30);
    mockPrismaService.graphNode.groupBy.mockResolvedValue([
      { type: NodeType.FILE, _count: { _all: 20 } },
      { type: NodeType.DIRECTORY, _count: { _all: 5 } },
    ]);
    mockPrismaService.graphEdge.groupBy.mockResolvedValue([
      { type: EdgeType.CONTAINS, _count: { _all: 24 } },
      { type: EdgeType.IMPORTS, _count: { _all: 6 } },
    ]);
    mockPrismaService.graphNode.findFirst.mockResolvedValue({
      updatedAt: new Date("2026-08-24T12:00:00Z"),
    });

    const summary = await service.getGraphSummary("user-123", "repo-123");

    expect(summary.nodes).toBe(25);
    expect(summary.edges).toBe(30);
    expect(summary.status).toBe("READY");
    expect(summary.nodeTypeBreakdown[NodeType.FILE]).toBe(20);
    expect(summary.edgeTypeBreakdown[EdgeType.IMPORTS]).toBe(6);
  });

  it("should retrieve neighborhood sub-graph for a center node", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-123",
    });
    mockPrismaService.graphNode.findFirst.mockResolvedValue({
      id: "node-center",
      name: "auth.service.ts",
      type: NodeType.FILE,
    });

    mockPrismaService.graphEdge.findMany
      .mockResolvedValueOnce([
        {
          id: "edge-out-1",
          sourceNodeId: "node-center",
          targetNodeId: "node-target-1",
          type: EdgeType.IMPORTS,
          targetNode: { id: "node-target-1", name: "user.service.ts" },
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await service.getNeighborhood(
      "user-123",
      "repo-123",
      "node-center",
    );

    expect(result.centerNode.name).toBe("auth.service.ts");
    expect(result.connectedNodes.length).toBe(1);
    expect(result.edges.length).toBe(1);
  });
});

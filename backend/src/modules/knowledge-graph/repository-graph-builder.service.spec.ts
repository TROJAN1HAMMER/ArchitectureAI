import { Test, TestingModule } from "@nestjs/testing";
import { RepositoryGraphBuilderService } from "./repository-graph-builder.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { KnowledgeGraphService } from "./knowledge-graph.service.js";
import { ConflictException } from "@nestjs/common";
import { NodeType, EdgeType } from "@prisma/client";

describe("RepositoryGraphBuilderService Unit Tests", () => {
  let builderService: RepositoryGraphBuilderService;

  const mockRedisClient = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    repository: {
      findUnique: jest.fn(),
    },
    repositoryFile: {
      findMany: jest.fn(),
    },
    graphNode: {
      count: jest.fn().mockResolvedValue(10),
    },
    graphEdge: {
      count: jest.fn().mockResolvedValue(15),
    },
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  const mockKnowledgeGraphService = {
    verifyRepositoryOwnership: jest.fn().mockResolvedValue({ id: "conn-1" }),
    upsertNode: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        id: `id-${data.qualifiedName}`,
        ...data,
      }),
    ),
    upsertEdge: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        id: `id-${data.sourceNodeId}-${data.targetNodeId}-${data.type}`,
        ...data,
      }),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoryGraphBuilderService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: KnowledgeGraphService, useValue: mockKnowledgeGraphService },
      ],
    }).compile();

    builderService = module.get<RepositoryGraphBuilderService>(
      RepositoryGraphBuilderService,
    );
  });

  it("should throw ConflictException if Redis graph lock is already held", async () => {
    mockPrismaService.repository.findUnique.mockResolvedValue({
      id: "repo-123",
      fullName: "owner/repo",
    });
    mockRedisClient.set.mockResolvedValue(null); // Lock acquisition fails

    await expect(
      builderService.buildGraph("user-123", "repo-123"),
    ).rejects.toThrow(ConflictException);
  });

  it("should build repository hierarchy nodes and CONTAINS edges successfully", async () => {
    mockPrismaService.repository.findUnique.mockResolvedValue({
      id: "repo-123",
      fullName: "owner/repo",
      defaultBranch: "main",
      visibility: "public",
      language: "TypeScript",
    });
    mockPrismaService.repositoryFile.findMany.mockResolvedValue([
      {
        id: "f1",
        path: "src",
        name: "src",
        type: "tree",
        parentPath: null,
      },
      {
        id: "f2",
        path: "src/main.ts",
        name: "main.ts",
        extension: "ts",
        type: "blob",
        parentPath: "src",
      },
    ]);
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.get.mockImplementation(async (_key: string) => {
      return mockRedisClient.set.mock.calls[0][1];
    });

    const result = await builderService.buildGraph("user-123", "repo-123");

    expect(result.status).toBe("SUCCESS");
    expect(mockKnowledgeGraphService.upsertNode).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NodeType.REPOSITORY,
        qualifiedName: "repository:repo-123",
      }),
    );
    expect(mockKnowledgeGraphService.upsertNode).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NodeType.DIRECTORY,
        path: "src",
      }),
    );
    expect(mockKnowledgeGraphService.upsertNode).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NodeType.FILE,
        path: "src/main.ts",
      }),
    );

    expect(mockKnowledgeGraphService.upsertEdge).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EdgeType.CONTAINS,
      }),
    );
    expect(mockRedisClient.del).toHaveBeenCalled();
  });

  it("should release Redis lock in finally block even if build fails", async () => {
    mockPrismaService.repository.findUnique.mockResolvedValue({
      id: "repo-123",
      fullName: "owner/repo",
    });
    mockPrismaService.repositoryFile.findMany.mockRejectedValue(
      new Error("Database connection lost"),
    );
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.get.mockImplementation(async () => {
      return mockRedisClient.set.mock.calls[0][1];
    });

    await expect(
      builderService.buildGraph("user-123", "repo-123"),
    ).rejects.toThrow("Database connection lost");

    expect(mockRedisClient.del).toHaveBeenCalled();
  });

  it("should extract relative import paths correctly", () => {
    const tsPaths = builderService.extractImportPaths(
      "src/modules/auth/auth.service.ts",
      "ts",
    );
    expect(tsPaths.length).toBeGreaterThan(0);
    expect(tsPaths).toContain("src/modules/auth/service");
  });
});

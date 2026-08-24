import { Test, TestingModule } from "@nestjs/testing";
import { SystemDesignService } from "./system-design.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { SystemDesignDiscoveryService } from "./system-design-discovery.service.js";
import { DiagramGenerationService } from "./diagram-generation.service.js";
import { DiagramLayoutService } from "./diagram-layout.service.js";
import { ConflictException } from "@nestjs/common";

describe("SystemDesignService Unit Tests", () => {
  let service: SystemDesignService;

  const mockRedisClient = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    systemDesign: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    diagram: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    diagramNode: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    diagramEdge: {
      create: jest.fn(),
    },
    graphNode: { findMany: jest.fn().mockResolvedValue([]) },
    graphEdge: { findMany: jest.fn().mockResolvedValue([]) },
  };

  const mockKnowledgeGraphService = {
    verifyRepositoryOwnership: jest.fn().mockResolvedValue({ id: "conn-1" }),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemDesignService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: KnowledgeGraphService, useValue: mockKnowledgeGraphService },
        SystemDesignDiscoveryService,
        DiagramGenerationService,
        DiagramLayoutService,
      ],
    }).compile();

    service = module.get<SystemDesignService>(SystemDesignService);
  });

  it("should throw ConflictException if Redis generation lock is already held", async () => {
    mockRedisClient.set.mockResolvedValue(null);

    await expect(
      service.generateSystemDesign("user-1", "repo-1"),
    ).rejects.toThrow(ConflictException);
  });

  it("should generate system design and release Redis lock", async () => {
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.get.mockImplementation(async () => {
      return mockRedisClient.set.mock.calls[0][1];
    });

    mockPrismaService.systemDesign.create.mockResolvedValue({
      id: "sd-1",
      version: 1,
    });
    mockPrismaService.diagram.create.mockResolvedValue({ id: "d-1" });
    mockPrismaService.diagramNode.create.mockResolvedValue({ id: "dn-1" });

    const res = await service.generateSystemDesign("user-1", "repo-1");
    expect(res.systemDesignId).toBe("sd-1");
    expect(mockRedisClient.del).toHaveBeenCalled();
  });
});

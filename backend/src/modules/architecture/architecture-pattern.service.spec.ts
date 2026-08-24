import { Test, TestingModule } from "@nestjs/testing";
import { ArchitecturePatternService } from "./architecture-pattern.service.js";
import { GraphNode, GraphEdge, NodeType } from "@prisma/client";

describe("ArchitecturePatternService Unit Tests", () => {
  let service: ArchitecturePatternService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchitecturePatternService],
    }).compile();

    service = module.get<ArchitecturePatternService>(
      ArchitecturePatternService,
    );
  });

  it("should detect Modular Monolith and Service Layer patterns", () => {
    const nodes: GraphNode[] = [
      {
        id: "n1",
        repositoryId: "r1",
        fileId: null,
        type: NodeType.FILE,
        name: "user.service.ts",
        qualifiedName: "backend/src/modules/users/user.service.ts",
        path: "backend/src/modules/users/user.service.ts",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "n2",
        repositoryId: "r1",
        fileId: null,
        type: NodeType.FILE,
        name: "auth.service.ts",
        qualifiedName: "backend/src/modules/auth/auth.service.ts",
        path: "backend/src/modules/auth/auth.service.ts",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const edges: GraphEdge[] = [];

    const { patterns } = service.detectPatterns(nodes, edges);

    expect(patterns.some((p) => p.name === "Modular Monolith")).toBe(true);
    expect(patterns.some((p) => p.name === "Service Layer Pattern")).toBe(true);
  });
});

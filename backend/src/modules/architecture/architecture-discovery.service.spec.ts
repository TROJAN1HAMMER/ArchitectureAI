import { Test, TestingModule } from "@nestjs/testing";
import { ArchitectureDiscoveryService } from "./architecture-discovery.service.js";
import { GraphNode, GraphEdge, NodeType, EdgeType } from "@prisma/client";

describe("ArchitectureDiscoveryService Unit Tests", () => {
  let service: ArchitectureDiscoveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchitectureDiscoveryService],
    }).compile();

    service = module.get<ArchitectureDiscoveryService>(
      ArchitectureDiscoveryService,
    );
  });

  it("should group files into logical architectural components", () => {
    const nodes: GraphNode[] = [
      {
        id: "n1",
        repositoryId: "repo-1",
        fileId: "f1",
        type: NodeType.FILE,
        name: "auth.service.ts",
        qualifiedName: "backend/src/modules/auth/auth.service.ts",
        path: "backend/src/modules/auth/auth.service.ts",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "n2",
        repositoryId: "repo-1",
        fileId: "f2",
        type: NodeType.FILE,
        name: "Button.tsx",
        qualifiedName: "frontend/src/components/Button.tsx",
        path: "frontend/src/components/Button.tsx",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const edges: GraphEdge[] = [
      {
        id: "e1",
        repositoryId: "repo-1",
        sourceNodeId: "n2",
        targetNodeId: "n1",
        type: EdgeType.IMPORTS,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const components = service.discoverComponents(nodes, edges);

    expect(components.length).toBeGreaterThanOrEqual(2);
    const authComp = components.find((c) => c.type === "service");
    const frontendComp = components.find((c) => c.type === "frontend");

    expect(authComp).toBeDefined();
    expect(frontendComp).toBeDefined();
    expect(authComp?.metrics.nodeCount).toBe(1);
  });
});

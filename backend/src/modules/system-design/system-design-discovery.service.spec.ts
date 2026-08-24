import { Test, TestingModule } from "@nestjs/testing";
import { SystemDesignDiscoveryService } from "./system-design-discovery.service.js";
import { GraphNode, NodeType } from "@prisma/client";

describe("SystemDesignDiscoveryService Unit Tests", () => {
  let service: SystemDesignDiscoveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemDesignDiscoveryService],
    }).compile();

    service = module.get<SystemDesignDiscoveryService>(
      SystemDesignDiscoveryService,
    );
  });

  it("should map C4 elements and relationships from Knowledge Graph nodes", () => {
    const nodes: GraphNode[] = [
      {
        id: "n1",
        repositoryId: "r1",
        fileId: "f1",
        type: NodeType.FILE,
        name: "auth.service.ts",
        qualifiedName: "backend/src/modules/auth/auth.service.ts",
        path: "backend/src/modules/auth/auth.service.ts",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { elements, relationships } = service.discoverSystemElements(
      nodes,
      [],
    );

    expect(elements.length).toBeGreaterThanOrEqual(4);
    expect(elements.some((e) => e.name === "User / Engineer")).toBe(true);
    expect(elements.some((e) => e.name === "ArchitectAI System")).toBe(true);
    expect(elements.some((e) => e.name === "Frontend Web Application")).toBe(
      true,
    );
    expect(relationships.length).toBeGreaterThan(0);
  });
});

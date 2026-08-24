import { Test, TestingModule } from "@nestjs/testing";
import { ArchitectureAuditorService } from "./architecture-auditor.service.js";
import {
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  ArchitectureFindingType,
} from "@prisma/client";

describe("ArchitectureAuditorService Unit Tests", () => {
  let service: ArchitectureAuditorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchitectureAuditorService],
    }).compile();

    service = module.get<ArchitectureAuditorService>(
      ArchitectureAuditorService,
    );
  });

  it("should detect circular dependencies and prevent duplicates", () => {
    const nodes: GraphNode[] = [
      {
        id: "A",
        repositoryId: "r1",
        fileId: null,
        type: NodeType.FILE,
        name: "A.ts",
        qualifiedName: "A",
        path: "src/A.ts",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "B",
        repositoryId: "r1",
        fileId: null,
        type: NodeType.FILE,
        name: "B.ts",
        qualifiedName: "B",
        path: "src/B.ts",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "C",
        repositoryId: "r1",
        fileId: null,
        type: NodeType.FILE,
        name: "C.ts",
        qualifiedName: "C",
        path: "src/C.ts",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const edges: GraphEdge[] = [
      {
        id: "e1",
        repositoryId: "r1",
        sourceNodeId: "A",
        targetNodeId: "B",
        type: EdgeType.IMPORTS,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "e2",
        repositoryId: "r1",
        sourceNodeId: "B",
        targetNodeId: "C",
        type: EdgeType.IMPORTS,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "e3",
        repositoryId: "r1",
        sourceNodeId: "C",
        targetNodeId: "A",
        type: EdgeType.IMPORTS,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const findings = service.auditArchitecture(nodes, edges);
    const cycleFindings = findings.filter(
      (f) => f.type === ArchitectureFindingType.CIRCULAR_DEPENDENCY,
    );

    expect(cycleFindings.length).toBe(1);
    expect(cycleFindings[0].evidence.cycleLength).toBe(3);
  });

  it("should detect boundary violations when frontend imports backend implementation", () => {
    const nodes: GraphNode[] = [
      {
        id: "UI",
        repositoryId: "r1",
        fileId: null,
        type: NodeType.FILE,
        name: "View.tsx",
        qualifiedName: "frontend/View.tsx",
        path: "frontend/View.tsx",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "DB",
        repositoryId: "r1",
        fileId: null,
        type: NodeType.FILE,
        name: "db.ts",
        qualifiedName: "backend/db.ts",
        path: "backend/db.ts",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const edges: GraphEdge[] = [
      {
        id: "e1",
        repositoryId: "r1",
        sourceNodeId: "UI",
        targetNodeId: "DB",
        type: EdgeType.IMPORTS,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const findings = service.auditArchitecture(nodes, edges);
    const boundaryFinding = findings.find(
      (f) => f.type === ArchitectureFindingType.BOUNDARY_VIOLATION,
    );

    expect(boundaryFinding).toBeDefined();
    expect(boundaryFinding?.severity).toBe("CRITICAL");
  });
});

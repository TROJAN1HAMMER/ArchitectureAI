import { Test, TestingModule } from "@nestjs/testing";
import { DiagramLayoutService } from "./diagram-layout.service.js";

describe("DiagramLayoutService Unit Tests", () => {
  let service: DiagramLayoutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiagramLayoutService],
    }).compile();

    service = module.get<DiagramLayoutService>(DiagramLayoutService);
  });

  it("should compute deterministic node coordinates without overlaps", () => {
    const nodes = [
      { id: "n1", name: "Node 1", type: "SYSTEM" },
      { id: "n2", name: "Node 2", type: "CONTAINER" },
    ];

    const layout = service.computeDeterministicLayout(nodes, "SYSTEM_CONTEXT");

    expect(layout.length).toBe(2);
    expect(layout[0].x).not.toEqual(layout[1].x);
  });
});

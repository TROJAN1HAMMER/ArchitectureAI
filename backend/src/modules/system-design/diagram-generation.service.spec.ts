import { Test, TestingModule } from "@nestjs/testing";
import { DiagramGenerationService } from "./diagram-generation.service.js";
import { DiagramLayoutService } from "./diagram-layout.service.js";
import { DiscoveredSystemElement } from "./system-design-discovery.service.js";

describe("DiagramGenerationService Unit Tests", () => {
  let service: DiagramGenerationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiagramGenerationService, DiagramLayoutService],
    }).compile();

    service = module.get<DiagramGenerationService>(DiagramGenerationService);
  });

  it("should generate System Context, Container, and Component C4 diagrams", () => {
    const elements: DiscoveredSystemElement[] = [
      {
        name: "User / Engineer",
        type: "PERSON",
        label: "User",
        description: "User",
      },
      {
        name: "ArchitectAI System",
        type: "SYSTEM",
        label: "System",
        description: "System",
      },
      {
        name: "Frontend Web Application",
        type: "CONTAINER",
        label: "UI",
        description: "UI",
      },
    ];

    const diagrams = service.generateAllDiagrams(elements, []);

    expect(diagrams.length).toBe(3);
    expect(diagrams[0].type).toBe("SYSTEM_CONTEXT");
    expect(diagrams[1].type).toBe("CONTAINER");
    expect(diagrams[2].type).toBe("COMPONENT");
  });
});

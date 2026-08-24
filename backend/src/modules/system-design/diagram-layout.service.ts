import { Injectable } from "@nestjs/common";

export interface NodePosition {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

@Injectable()
export class DiagramLayoutService {
  computeDeterministicLayout(
    nodes: Array<{ id: string; name: string; type: string }>,
    diagramType: string,
    existingPositions?: Map<string, { x: number; y: number }>,
  ): NodePosition[] {
    const layoutNodes: NodePosition[] = [];

    // Canvas configuration
    const defaultWidth = 200;
    const defaultHeight = 90;
    const paddingX = 80;
    const paddingY = 100;
    const startX = 100;
    const startY = 100;

    // Grid layout calculation
    const cols = diagramType === "SYSTEM_CONTEXT" ? 3 : 3;

    nodes.forEach((node, idx) => {
      // Preserve custom position if available
      if (existingPositions && existingPositions.has(node.id)) {
        const pos = existingPositions.get(node.id)!;
        layoutNodes.push({
          id: node.id,
          name: node.name,
          x: pos.x,
          y: pos.y,
          width: defaultWidth,
          height: defaultHeight,
        });
        return;
      }

      const row = Math.floor(idx / cols);
      const col = idx % cols;

      const x = startX + col * (defaultWidth + paddingX);
      const y = startY + row * (defaultHeight + paddingY);

      layoutNodes.push({
        id: node.id,
        name: node.name,
        x,
        y,
        width: defaultWidth,
        height: defaultHeight,
      });
    });

    return layoutNodes;
  }
}

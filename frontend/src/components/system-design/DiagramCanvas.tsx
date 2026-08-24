"use client";

import React, { useState } from "react";
import { DiagramNode } from "./DiagramNode";
import { DiagramEdge } from "./DiagramEdge";

interface DiagramCanvasProps {
  diagram: any;
  selectedNodeType: string;
  onSelectNode: (node: any) => void;
  onUpdateNodePos: (nodeId: string, x: number, y: number) => void;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  diagram,
  selectedNodeType,
  onSelectNode,
}) => {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  if (!diagram || !diagram.nodes) {
    return (
      <div className="h-96 flex items-center justify-center text-xs text-gray-500 bg-gray-950 rounded-b-xl">
        No diagram data available.
      </div>
    );
  }

  const filteredNodes =
    selectedNodeType === "ALL"
      ? diagram.nodes
      : diagram.nodes.filter(
          (n: any) => n.type.toUpperCase() === selectedNodeType.toUpperCase(),
        );

  const nodeMap = new Map(diagram.nodes.map((n: any) => [n.id, n]));

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    onSelectNode(node);
  };

  return (
    <div className="relative w-full h-[520px] bg-gray-950 border-x border-b border-gray-800 rounded-b-xl overflow-hidden select-none">
      <svg
        id="system-design-svg-canvas"
        className="w-full h-full"
        onClick={() => {
          setSelectedNode(null);
          onSelectNode(null);
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" className="fill-cyan-500" />
          </marker>
        </defs>

        {/* Render Edges */}
        {diagram.edges &&
          diagram.edges.map((edge: any) => (
            <DiagramEdge
              key={edge.id}
              edge={edge}
              sourceNode={nodeMap.get(edge.sourceNodeId)}
              targetNode={nodeMap.get(edge.targetNodeId)}
            />
          ))}

        {/* Render Nodes */}
        {filteredNodes.map((node: any) => (
          <DiagramNode
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            onSelect={handleNodeClick}
            onDragEnd={() => {}}
          />
        ))}
      </svg>
    </div>
  );
};

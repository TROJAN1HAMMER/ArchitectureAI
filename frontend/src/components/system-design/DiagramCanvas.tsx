"use client";

import React, { useState, useMemo } from "react";
import { DiagramNode } from "./DiagramNode";
import { DiagramEdge } from "./DiagramEdge";
import { LayoutGrid, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface DiagramCanvasProps {
  diagram: any;
  selectedNodeType: string;
  onSelectNode: (node: any) => void;
  onUpdateNodePos: (nodeId: string, x: number, y: number) => void;
  onReanalyze?: () => void;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  diagram,
  selectedNodeType,
  onSelectNode,
  onReanalyze,
}) => {
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const nodes = useMemo(() => diagram?.nodes || [], [diagram]);
  const edges = useMemo(() => diagram?.edges || [], [diagram]);

  const filteredNodes = useMemo(() => {
    if (selectedNodeType === "ALL") return nodes;
    return nodes.filter(
      (n: any) => n.type.toUpperCase() === selectedNodeType.toUpperCase(),
    );
  }, [nodes, selectedNodeType]);

  const nodeMap = useMemo(
    () => new Map(nodes.map((n: any) => [n.id, n])),
    [nodes],
  );

  // Compute dynamic viewBox for automatic crisp graph fit
  const computedViewBox = useMemo(() => {
    if (nodes.length === 0) return "0 0 800 500";

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const w = node.width || 200;
      const h = node.height || 90;
      if (node.x < minX) minX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.x + w > maxX) maxX = node.x + w;
      if (node.y + h > maxY) maxY = node.y + h;
    }

    const pad = 60;
    const boxW = Math.max(maxX - minX + pad * 2, 700) / zoomLevel;
    const boxH = Math.max(maxY - minY + pad * 2, 450) / zoomLevel;
    const boxX = minX - pad + (maxX - minX + pad * 2 - boxW) / 2;
    const boxY = minY - pad + (maxY - minY + pad * 2 - boxH) / 2;

    return `${boxX} ${boxY} ${boxW} ${boxH}`;
  }, [nodes, zoomLevel]);

  if (!diagram || nodes.length === 0) {
    return (
      <div className="h-[460px] flex flex-col items-center justify-center text-center p-8 bg-gray-950/80 rounded-b-xl border-t border-gray-800/80">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-lg">
          <LayoutGrid className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-white">
          No Component Architecture Inferred
        </h4>
        <p className="mt-1 max-w-md text-xs text-gray-400 leading-relaxed">
          Component-level relationships could not be derived from the current
          repository structure. Run an Architecture Audit to extract domain
          boundaries or re-generate the system design.
        </p>
        {onReanalyze && (
          <button
            onClick={onReanalyze}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
          >
            Re-analyze Architecture
          </button>
        )}
      </div>
    );
  }

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    onSelectNode(node);
  };

  return (
    <div className="relative w-full h-[520px] bg-gray-950 border-x border-b border-gray-800 rounded-b-xl overflow-hidden select-none">
      {/* Floating Canvas Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-gray-900/90 backdrop-blur-md p-1.5 rounded-lg border border-gray-800 shadow-xl">
        <button
          onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.0))}
          title="Zoom In"
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-gray-400 px-1">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.5))}
          title="Zoom Out"
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(1.0)}
          title="Fit View"
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <svg
        id="system-design-svg-canvas"
        viewBox={computedViewBox}
        className="w-full h-full cursor-grab active:cursor-grabbing"
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
        {edges.map((edge: any) => (
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

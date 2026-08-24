"use client";

import React from "react";

interface DiagramEdgeProps {
  edge: any;
  sourceNode: any;
  targetNode: any;
}

export const DiagramEdge: React.FC<DiagramEdgeProps> = ({
  edge,
  sourceNode,
  targetNode,
}) => {
  if (!sourceNode || !targetNode) return null;

  const srcWidth = sourceNode.width || 180;
  const srcHeight = sourceNode.height || 85;
  const tgtWidth = targetNode.width || 180;
  const tgtHeight = targetNode.height || 85;

  const x1 = sourceNode.x + srcWidth / 2;
  const y1 = sourceNode.y + srcHeight / 2;
  const x2 = targetNode.x + tgtWidth / 2;
  const y2 = targetNode.y + tgtHeight / 2;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g className="group pointer-events-none">
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className="stroke-cyan-500/70 stroke-[2px] marker-end-[url(#arrowhead)] transition group-hover:stroke-cyan-400 group-hover:stroke-[3px]"
        strokeDasharray={edge.type === "CONTAINS" ? "4 4" : undefined}
      />
      {edge.label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-50}
            y={-10}
            width={100}
            height={20}
            rx={4}
            className="fill-gray-950/90 stroke-gray-800 stroke-1"
          />
          <text
            x={0}
            y={3}
            textAnchor="middle"
            className="fill-cyan-300 font-mono text-[9px] font-semibold"
          >
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
};

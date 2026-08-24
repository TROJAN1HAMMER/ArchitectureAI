"use client";

import React from "react";

interface DiagramNodeProps {
  node: any;
  isSelected: boolean;
  onSelect: (node: any) => void;
  onDragEnd: (nodeId: string, x: number, y: number) => void;
}

export const DiagramNode: React.FC<DiagramNodeProps> = ({
  node,
  isSelected,
  onSelect,
}) => {
  const getNodeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "PERSON":
        return "bg-blue-900/80 border-blue-500 text-blue-100";
      case "SYSTEM":
        return "bg-indigo-900/80 border-indigo-500 text-indigo-100";
      case "CONTAINER":
        return "bg-cyan-900/80 border-cyan-500 text-cyan-100";
      case "COMPONENT":
      case "SERVICE":
        return "bg-purple-900/80 border-purple-500 text-purple-100";
      case "DATABASE":
        return "bg-emerald-900/80 border-emerald-500 text-emerald-100";
      default:
        return "bg-gray-900/80 border-gray-600 text-gray-100";
    }
  };

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
      className="cursor-pointer group"
    >
      <rect
        width={node.width || 180}
        height={node.height || 85}
        rx={10}
        ry={10}
        className={`transition shadow-xl ${getNodeColor(node.type)} ${
          isSelected
            ? "stroke-[3px] stroke-amber-400"
            : "stroke-1 hover:stroke-2 hover:stroke-white"
        }`}
      />
      <text
        x={(node.width || 180) / 2}
        y={28}
        textAnchor="middle"
        className="fill-white font-bold text-[12px] pointer-events-none"
      >
        {node.name}
      </text>
      <text
        x={(node.width || 180) / 2}
        y={48}
        textAnchor="middle"
        className="fill-gray-300 text-[10px] font-mono pointer-events-none"
      >
        [{node.label || node.type}]
      </text>
      <text
        x={(node.width || 180) / 2}
        y={66}
        textAnchor="middle"
        className="fill-gray-400 text-[9px] pointer-events-none truncate"
      >
        {node.description ? `${node.description.substring(0, 24)}...` : ""}
      </text>
    </g>
  );
};

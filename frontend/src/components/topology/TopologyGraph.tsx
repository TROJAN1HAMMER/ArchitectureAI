import React from "react";

export interface TopologyNode {
  repositoryId: string;
  name: string;
  fullName: string;
  role: string;
  language?: string;
}

export interface TopologyEdge {
  id: string;
  sourceRepositoryId: string;
  targetRepositoryId: string;
  sourceName: string;
  targetName: string;
  type: string;
  confidence: string;
}

export function TopologyGraph({
  nodes,
  edges,
  onSelectRepository,
}: {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  onSelectRepository?: (repoId: string) => void;
}) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No repositories in this enterprise system topology yet.
      </div>
    );
  }

  // Calculate coordinates on a circle layout
  const width = 650;
  const height = 420;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 75;

  const nodePositions = new Map<string, { x: number; y: number }>();
  const total = nodes.length;

  nodes.forEach((node, idx) => {
    const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodePositions.set(node.repositoryId, { x, y });
  });

  const getRoleColor = (role: string) => {
    switch (role.toUpperCase()) {
      case "FRONTEND":
        return "#3b82f6"; // blue
      case "BACKEND":
      case "SERVICE":
        return "#10b981"; // emerald
      case "LIBRARY":
      case "SHARED":
        return "#8b5cf6"; // purple
      case "DATABASE":
        return "#f59e0b"; // amber
      case "INFRASTRUCTURE":
        return "#64748b"; // slate
      default:
        return "#06b6d4"; // cyan
    }
  };

  return (
    <div className="relative rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-white dark:border-zinc-800">
      <div className="absolute right-4 top-4 flex gap-3 text-xs font-medium text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>Frontend
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          Service
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span>
          Library
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
          Database
        </span>
      </div>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <marker
            id="topo-arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge) => {
          const sourcePos = nodePositions.get(edge.sourceRepositoryId);
          const targetPos = nodePositions.get(edge.targetRepositoryId);
          if (!sourcePos || !targetPos) return null;

          return (
            <g key={edge.id}>
              <line
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray={edge.type === "HTTP_CALL" ? "4,4" : undefined}
                markerEnd="url(#topo-arrow)"
              />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = nodePositions.get(node.repositoryId);
          if (!pos) return null;
          const color = getRoleColor(node.role);

          return (
            <g
              key={node.repositoryId}
              transform={`translate(${pos.x}, ${pos.y})`}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => onSelectRepository?.(node.repositoryId)}
            >
              <circle r="22" fill="#0f172a" stroke={color} strokeWidth="3" />
              <circle r="8" fill={color} />
              <text
                y="36"
                textAnchor="middle"
                className="fill-zinc-200 text-[11px] font-semibold tracking-wide"
              >
                {node.name}
              </text>
              <text
                y="48"
                textAnchor="middle"
                className="fill-zinc-500 text-[9px] font-mono"
              >
                {node.role}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

"use client";

import React from "react";
import { Filter } from "lucide-react";

interface DiagramFiltersProps {
  selectedNodeType: string;
  onSelectNodeType: (type: string) => void;
  availableNodeTypes: string[];
}

export const DiagramFilters: React.FC<DiagramFiltersProps> = ({
  selectedNodeType,
  onSelectNodeType,
  availableNodeTypes,
}) => {
  return (
    <div className="flex items-center gap-2 text-xs bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
      <Filter className="w-3.5 h-3.5 text-gray-400" />
      <span className="text-gray-400">Filter Nodes:</span>
      <select
        value={selectedNodeType}
        onChange={(e) => onSelectNodeType(e.target.value)}
        className="bg-gray-950 border border-gray-800 text-gray-200 rounded px-2 py-0.5 text-xs focus:outline-none"
      >
        <option value="ALL">All Node Types</option>
        {availableNodeTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
};

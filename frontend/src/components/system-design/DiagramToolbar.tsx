"use client";

import React from "react";
import { RotateCcw } from "lucide-react";
import { SystemDesignExportButton } from "./SystemDesignExportButton";
import { DiagramLegend } from "./DiagramLegend";

interface DiagramToolbarProps {
  diagram: any;
  onResetLayout: () => void;
}

export const DiagramToolbar: React.FC<DiagramToolbarProps> = ({
  diagram,
  onResetLayout,
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-bold text-white">
          {diagram?.name || "C4 Diagram"}
        </span>
        {diagram?.description && (
          <span className="text-gray-400 text-[11px] hidden md:inline">
            — {diagram.description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onResetLayout}
          className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-1.5 transition text-[11px]"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Layout
        </button>
        <DiagramLegend />
        <SystemDesignExportButton diagram={diagram} />
      </div>
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { Download, FileJson, FileCode } from "lucide-react";

interface SystemDesignExportButtonProps {
  diagram: any;
}

export const SystemDesignExportButton: React.FC<
  SystemDesignExportButtonProps
> = ({ diagram }) => {
  const [open, setOpen] = useState(false);

  const handleExportJSON = () => {
    if (!diagram) return;
    const jsonStr = JSON.stringify(diagram, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${diagram.name.replace(/\s+/g, "_")}_v1.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const handleExportSVG = () => {
    const svgEl = document.querySelector("#system-design-svg-canvas");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${diagram?.name?.replace(/\s+/g, "_") || "diagram"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-gray-700 transition"
      >
        <Download className="w-3.5 h-3.5" /> Export
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-30 py-1 text-xs text-gray-300">
          <button
            onClick={handleExportJSON}
            className="w-full text-left px-3 py-2 hover:bg-gray-800 flex items-center gap-2"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" /> Export JSON
          </button>
          <button
            onClick={handleExportSVG}
            className="w-full text-left px-3 py-2 hover:bg-gray-800 flex items-center gap-2"
          >
            <FileCode className="w-3.5 h-3.5 text-purple-400" /> Export SVG
          </button>
        </div>
      )}
    </div>
  );
};

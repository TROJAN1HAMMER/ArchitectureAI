"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

export const DiagramLegend: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-lg text-xs flex items-center gap-1.5 transition"
      >
        <Info className="w-3.5 h-3.5" /> C4 Legend
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-950 border border-gray-800 rounded-xl p-3 shadow-2xl text-xs space-y-2.5 z-30">
          <div className="font-semibold text-white border-b border-gray-800 pb-1">
            C4 Architecture Key
          </div>
          <div className="space-y-1.5 text-gray-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600 border border-blue-400" />
              <span>Person / User</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-indigo-600 border border-indigo-400" />
              <span>Software System</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-600 border border-cyan-400" />
              <span>Container (App / API)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-600 border border-purple-400" />
              <span>Component / Module</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-400" />
              <span>Database / Storage</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

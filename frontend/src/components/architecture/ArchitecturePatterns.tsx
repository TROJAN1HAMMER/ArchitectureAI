"use client";

import React from "react";
import { Compass, CheckCircle2 } from "lucide-react";

export interface PatternItem {
  name: string;
  confidence: number;
  explanation: string;
  supportingPaths?: string[];
}

interface ArchitecturePatternsProps {
  patterns: PatternItem[];
}

export const ArchitecturePatterns: React.FC<ArchitecturePatternsProps> = ({
  patterns,
}) => {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="p-6 bg-gray-900/60 border border-gray-800 rounded-xl text-center text-xs text-gray-400">
        No recognized architectural patterns detected.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {patterns.map((item, idx) => (
        <div
          key={idx}
          className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-white">{item.name}</h4>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              {Math.round(item.confidence * 100)}% Confidence
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {item.explanation}
          </p>
        </div>
      ))}
    </div>
  );
};

"use client";

import React from "react";
import { Layers, FileCode } from "lucide-react";

export interface ComponentItem {
  name: string;
  type: string;
  confidence: number;
  supportingNodeIds: string[];
  supportingPaths: string[];
  metrics: {
    nodeCount: number;
    fileCount: number;
    inboundDependencies: number;
    outboundDependencies: number;
  };
}

interface ArchitectureComponentsProps {
  components: ComponentItem[];
}

export const ArchitectureComponents: React.FC<ArchitectureComponentsProps> = ({
  components,
}) => {
  if (!components || components.length === 0) {
    return (
      <div className="p-6 bg-gray-900/60 border border-gray-800 rounded-xl text-center text-xs text-gray-400">
        No logical architectural components discovered yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {components.map((comp, idx) => (
        <div
          key={idx}
          className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-semibold text-white">{comp.name}</h4>
            </div>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded">
              {comp.type}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 bg-gray-950/60 p-2.5 rounded-lg border border-gray-800">
            <div>
              <div className="text-[10px] text-gray-400 uppercase">Files</div>
              <div className="font-semibold text-gray-200">
                {comp.metrics.fileCount}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase">Inbound</div>
              <div className="font-semibold text-emerald-400">
                {comp.metrics.inboundDependencies}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase">
                Outbound
              </div>
              <div className="font-semibold text-amber-400">
                {comp.metrics.outboundDependencies}
              </div>
            </div>
          </div>

          {comp.supportingPaths && comp.supportingPaths.length > 0 && (
            <div className="text-xs text-gray-400 space-y-1">
              <div className="text-[10px] text-gray-400 uppercase flex items-center gap-1">
                <FileCode className="w-3 h-3 text-gray-400" /> Sample Paths
              </div>
              <div className="font-mono text-[11px] text-gray-300 truncate">
                {comp.supportingPaths.slice(0, 2).join(", ")}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

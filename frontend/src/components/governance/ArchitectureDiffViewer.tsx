"use client";

import React from "react";
import {
  GitCompare,
  Plus,
  Minus,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export interface DiffItemData {
  id: string;
  type: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  sourceNodeName?: string | null;
  targetNodeName?: string | null;
}

interface ArchitectureDiffViewerProps {
  diff: any | null;
}

export const ArchitectureDiffViewer: React.FC<ArchitectureDiffViewerProps> = ({
  diff,
}) => {
  if (!diff || !diff.items) {
    return (
      <div className="p-6 bg-gray-950 border border-gray-800 rounded-xl text-center text-xs text-gray-500">
        No architecture diff recorded. Run a governance review to compare
        against previous snapshots.
      </div>
    );
  }

  const items: DiffItemData[] = diff.items;

  const getItemIcon = (type: string) => {
    switch (type) {
      case "ADDED":
      case "DEPENDENCY_ADDED":
        return <Plus className="w-3.5 h-3.5 text-emerald-400" />;
      case "REMOVED":
      case "DEPENDENCY_REMOVED":
        return <Minus className="w-3.5 h-3.5 text-rose-400" />;
      case "RISK_CHANGED":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-cyan-400" /> Architecture Snapshot
          Diff
        </h3>
        <span className="text-xs font-mono text-gray-400">
          v{diff.fromSnapshot?.version || "A"} → v
          {diff.toSnapshot?.version || "B"}
        </span>
      </div>

      <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-950 p-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-gray-500">
            No structural changes detected between snapshots.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-gray-900/60 border border-gray-800/80 rounded-lg flex items-start gap-3 text-xs"
            >
              <div className="mt-0.5 p-1.5 bg-gray-950 rounded border border-gray-800">
                {getItemIcon(item.type)}
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-2">
                  <span>{item.title}</span>
                  <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400">
                    {item.type}
                  </span>
                </div>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

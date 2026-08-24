"use client";

import React from "react";
import { GitCommit, Calendar } from "lucide-react";

export interface SnapshotItemData {
  id: string;
  version: number;
  label: string;
  commitSha?: string | null;
  branch?: string | null;
  nodesCount: number;
  edgesCount: number;
  riskScore: number;
  riskLevel: string;
  createdAt: string;
}

interface ArchitectureSnapshotListProps {
  snapshots: SnapshotItemData[];
}

export const ArchitectureSnapshotList: React.FC<
  ArchitectureSnapshotListProps
> = ({ snapshots }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <GitCommit className="w-4 h-4 text-purple-400" /> Architecture Snapshots
        ({snapshots.length})
      </h3>

      <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-950 p-4 space-y-3">
        {snapshots.length === 0 ? (
          <p className="text-xs text-gray-500">
            No architecture snapshots recorded yet.
          </p>
        ) : (
          snapshots.map((s) => (
            <div
              key={s.id}
              className="p-3 bg-gray-900/60 border border-gray-800/80 rounded-lg flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 font-bold rounded-lg font-mono">
                  v{s.version}
                </div>
                <div>
                  <div className="font-semibold text-white">{s.label}</div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                    <span>{s.nodesCount} Nodes</span> •{" "}
                    <span>{s.edgesCount} Edges</span>
                    {s.commitSha && (
                      <span className="font-mono text-indigo-300">
                        ({s.commitSha.substring(0, 7)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-white">
                  Risk: {s.riskScore.toFixed(1)}
                </div>
                <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 justify-end">
                  <Calendar className="w-3 h-3" />{" "}
                  {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

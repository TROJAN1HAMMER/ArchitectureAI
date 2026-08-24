"use client";

import React from "react";
import { LayoutGrid, Cpu, GitCommit } from "lucide-react";

export interface SystemDesignSummaryData {
  systemDesignId?: string;
  repositoryId: string;
  status: string;
  name?: string;
  version: number;
  generatedAt?: string | null;
  diagrams: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    nodeCount: number;
    edgeCount: number;
  }>;
}

interface SystemDesignOverviewProps {
  summary: SystemDesignSummaryData | null;
}

export const SystemDesignOverview: React.FC<SystemDesignOverviewProps> = ({
  summary,
}) => {
  if (!summary || summary.status === "NOT_GENERATED") {
    return (
      <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 text-sm">
        No C4 system design diagrams have been generated for this repository
        yet. Click &quot;Generate System Design&quot; to begin.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center gap-3">
        <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
          <GitCommit className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-medium">
            Design Version
          </div>
          <div className="text-xl font-bold text-white">
            v{summary.version}{" "}
            <span className="text-xs font-normal text-gray-400">Current</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center gap-3">
        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <LayoutGrid className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-medium">
            Generated Diagrams
          </div>
          <div className="text-xl font-bold text-white">
            {summary.diagrams.length} Views
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center gap-3">
        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-medium">
            Last Generated
          </div>
          <div className="text-sm font-semibold text-white">
            {summary.generatedAt
              ? new Date(summary.generatedAt).toLocaleString()
              : "Just now"}
          </div>
        </div>
      </div>
    </div>
  );
};

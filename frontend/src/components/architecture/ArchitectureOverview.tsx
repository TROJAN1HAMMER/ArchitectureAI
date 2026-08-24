"use client";

import React from "react";
import { ShieldAlert, Cpu, GitFork, AlertTriangle } from "lucide-react";

export interface ArchitectureSummary {
  analysisId?: string;
  repositoryId: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  nodesAnalyzed: number;
  edgesAnalyzed: number;
  findingsGenerated: number;
  completedAt?: string | null;
  errorMessage?: string | null;
  riskExplanation?: string;
}

interface ArchitectureOverviewProps {
  summary: ArchitectureSummary | null;
}

export const ArchitectureOverview: React.FC<ArchitectureOverviewProps> = ({
  summary,
}) => {
  if (!summary || summary.status === "NOT_RUN") {
    return (
      <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
        No architecture analysis has been run for this repository yet. Click
        &quot;Analyze Architecture&quot; to begin.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center gap-3">
        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-medium">Risk Score</div>
          <div className="text-xl font-bold text-white">
            {summary.riskScore}{" "}
            <span className="text-xs font-normal text-gray-400">/ 100</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center gap-3">
        <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-medium">Graph Nodes</div>
          <div className="text-xl font-bold text-white">
            {summary.nodesAnalyzed}
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center gap-3">
        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
          <GitFork className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-medium">Graph Edges</div>
          <div className="text-xl font-bold text-white">
            {summary.edgesAnalyzed}
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex items-center gap-3">
        <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-medium">
            Total Findings
          </div>
          <div className="text-xl font-bold text-white">
            {summary.findingsGenerated}
          </div>
        </div>
      </div>
    </div>
  );
};

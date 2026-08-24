"use client";

import React from "react";
import { History, CheckCircle, XCircle, Clock } from "lucide-react";

export interface AnalysisHistoryItem {
  id: string;
  status: string;
  nodesAnalyzed: number;
  edgesAnalyzed: number;
  findingsGenerated: number;
  riskScore: number;
  riskLevel: string;
  createdAt: string;
}

interface ArchitectureHistoryProps {
  history: AnalysisHistoryItem[];
}

export const ArchitectureHistory: React.FC<ArchitectureHistoryProps> = ({
  history,
}) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-6 bg-gray-900/60 border border-gray-800 rounded-xl text-center text-xs text-gray-400">
        No previous architecture analysis history found.
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400 animate-spin" />;
    }
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <History className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">
          Analysis Run History
        </h3>
      </div>
      <div className="divide-y divide-gray-800">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-4 flex items-center justify-between text-xs hover:bg-gray-800/40 transition"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(item.status)}
              <div>
                <div className="font-semibold text-white uppercase">
                  {item.status}
                </div>
                <div className="text-[11px] text-gray-400">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-gray-300">
              <div>
                <span className="text-gray-400">Nodes/Edges:</span>{" "}
                <span className="font-mono text-white">
                  {item.nodesAnalyzed} / {item.edgesAnalyzed}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Findings:</span>{" "}
                <span className="font-semibold text-amber-400">
                  {item.findingsGenerated}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Risk:</span>{" "}
                <span className="font-bold text-indigo-300">
                  {item.riskScore} ({item.riskLevel})
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

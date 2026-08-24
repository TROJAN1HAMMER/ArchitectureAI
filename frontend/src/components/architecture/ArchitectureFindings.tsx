"use client";

import React, { useState } from "react";
import { AlertCircle, Filter, ChevronRight } from "lucide-react";

export interface FindingItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  confidence: number;
  evidence?: any;
}

interface ArchitectureFindingsProps {
  findings: FindingItem[];
  onSelectFinding: (finding: FindingItem) => void;
}

export const ArchitectureFindings: React.FC<ArchitectureFindingsProps> = ({
  findings,
  onSelectFinding,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");

  const filtered =
    selectedSeverity === "ALL"
      ? findings
      : findings.filter((f) => f.severity.toUpperCase() === selectedSeverity);

  const getSeverityBadge = (sev: string) => {
    switch (sev.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "LOW":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-400" /> Architectural
          Findings ({filtered.length})
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-gray-300 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-gray-800/60">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">
            No architectural findings match the selected filter.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectFinding(item)}
              className="p-4 hover:bg-gray-800/40 cursor-pointer transition flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getSeverityBadge(
                      item.severity,
                    )}`}
                  >
                    {item.severity}
                  </span>
                  <span className="text-xs font-mono text-indigo-300">
                    {item.type}
                  </span>
                </div>
                <div className="text-sm font-medium text-white">
                  {item.title}
                </div>
                <div className="text-xs text-gray-400 line-clamp-1">
                  {item.description}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  Confidence:{" "}
                  <span className="text-gray-200 font-semibold">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

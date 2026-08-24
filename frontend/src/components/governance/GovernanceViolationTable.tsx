"use client";

import React, { useState } from "react";
import { AlertCircle, Eye, Filter } from "lucide-react";

export interface GovernanceViolationItem {
  id: string;
  ruleId: string;
  rule?: { name: string; ruleType: string };
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  description: string;
  confidence: number;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "IGNORED";
  createdAt: string;
  evidence?: any;
}

interface GovernanceViolationTableProps {
  violations: GovernanceViolationItem[];
  onSelectViolation: (item: GovernanceViolationItem) => void;
  onUpdateStatus: (violationId: string, status: string) => void;
}

export const GovernanceViolationTable: React.FC<
  GovernanceViolationTableProps
> = ({ violations, onSelectViolation, onUpdateStatus }) => {
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");

  const filtered = violations.filter((v) => {
    if (severityFilter !== "ALL" && v.severity !== severityFilter) return false;
    if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          Governance Policy Violations ({filtered.length})
        </h3>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-gray-950 text-gray-200 border border-gray-800 rounded px-2 py-0.5"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-950 text-gray-200 border border-gray-800 rounded px-2 py-0.5"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
              <option value="IGNORED">Ignored</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-950 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 border-b border-gray-800 text-gray-400">
              <tr>
                <th className="p-3 font-semibold">Severity</th>
                <th className="p-3 font-semibold">Violation Title</th>
                <th className="p-3 font-semibold">Governance Rule</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    No governance violations match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-900/40 transition">
                    <td className="p-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(item.severity)}`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      {item.title}
                    </td>
                    <td className="p-3 text-gray-400 font-mono">
                      {item.rule?.name || item.ruleId}
                    </td>
                    <td className="p-3">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          onUpdateStatus(item.id, e.target.value)
                        }
                        className="bg-gray-900 text-gray-300 border border-gray-800 rounded px-2 py-0.5 text-xs"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="IGNORED">IGNORED</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onSelectViolation(item)}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded flex items-center gap-1.5 text-xs ml-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

"use client";

import React from "react";

export interface GraphSummaryData {
  repositoryId: string;
  nodes: number;
  edges: number;
  nodeTypeBreakdown?: Record<string, number>;
  edgeTypeBreakdown?: Record<string, number>;
  lastBuiltAt?: string | null;
  status: "READY" | "EMPTY" | string;
}

interface GraphSummaryProps {
  summary: GraphSummaryData | null;
}

export function GraphSummary({ summary }: GraphSummaryProps) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Knowledge Graph Status
        </span>
        <div className="flex items-center gap-2 pt-0.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              summary.status === "READY"
                ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                summary.status === "READY" ? "bg-green-500" : "bg-zinc-400"
              }`}
            />
            {summary.status}
          </span>

          {summary.lastBuiltAt && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Built {new Date(summary.lastBuiltAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Graph Structure
        </span>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-0.5">
          {summary.nodes} Nodes • {summary.edges} Relationships
        </p>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Entities Mapped
        </span>
        <div className="flex flex-wrap gap-1 pt-1">
          {summary.nodeTypeBreakdown &&
            Object.entries(summary.nodeTypeBreakdown).map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-mono text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <span>{type}</span>
                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                  {count}
                </span>
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

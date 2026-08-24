"use client";

import React, { useState } from "react";
import { FileText, ChevronDown, ChevronRight } from "lucide-react";

export interface AISourceItem {
  fileId?: string | null;
  path: string;
  score: number;
  reason: string;
  graphConnections?: Array<{ nodeName: string; type: string }>;
}

interface AISourceListProps {
  sources: AISourceItem[];
}

export const AISourceList: React.FC<AISourceListProps> = ({ sources }) => {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
      >
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-emerald-500" />
          Retrieved Grounded Sources ({sources.length})
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-zinc-200 pt-2.5 dark:border-zinc-800">
          {sources.map((source, idx) => {
            const pctScore = (source.score * 100).toFixed(0);
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1 rounded bg-white p-2 border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800/80"
              >
                <div className="flex items-center gap-2 font-mono text-zinc-800 dark:text-zinc-200 truncate">
                  <span className="text-zinc-400 font-sans">{idx + 1}.</span>
                  <span className="truncate">{source.path}</span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    {pctScore}% match
                  </span>
                  {source.reason === "semantic_and_graph" && (
                    <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                      Graph + Vector
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

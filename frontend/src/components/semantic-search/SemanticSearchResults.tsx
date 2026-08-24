"use client";

import React from "react";

export interface SemanticSearchResultItem {
  fileId: string | null;
  path: string;
  score: number;
  content: string;
  metadata: any;
}

interface SemanticSearchResultsProps {
  results: SemanticSearchResultItem[];
  query: string;
}

export function SemanticSearchResults({
  results,
  query,
}: SemanticSearchResultsProps) {
  if (!query) return null;

  if (results.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          No semantic search matches found for &quot;{query}&quot;. Try indexing
          the repository or refining your query.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Search Results for &quot;{query}&quot; ({results.length} ranked
          matches)
        </h3>
      </div>

      <div className="space-y-3">
        {results.map((item, idx) => (
          <div
            key={`${item.fileId || item.path}-${idx}`}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2 dark:border-zinc-800 dark:bg-zinc-950 transition hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                  {item.path}
                </span>
                {item.metadata?.language && (
                  <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
                    {item.metadata.language}
                  </span>
                )}
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                Score: {(item.score * 100).toFixed(1)}%
              </span>
            </div>

            <div className="rounded-lg bg-zinc-900 p-3 text-[11px] font-mono text-zinc-100 overflow-x-auto max-h-48 dark:bg-zinc-900 border border-zinc-800">
              <pre className="whitespace-pre-wrap">{item.content}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

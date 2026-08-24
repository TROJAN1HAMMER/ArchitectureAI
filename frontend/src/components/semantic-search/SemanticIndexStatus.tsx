"use client";

import React from "react";

export interface SemanticIndexStatusData {
  repositoryId: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | string;
  filesDiscovered: number;
  filesProcessed: number;
  filesSkipped: number;
  filesFailed: number;
  totalEmbeddings: number;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
}

interface SemanticIndexStatusProps {
  statusData: SemanticIndexStatusData | null;
}

export function SemanticIndexStatus({ statusData }: SemanticIndexStatusProps) {
  if (!statusData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Semantic Index Status
        </span>
        <div className="flex items-center gap-2 pt-0.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              statusData.status === "SUCCESS"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : statusData.status === "RUNNING"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  : statusData.status === "FAILED"
                    ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                statusData.status === "SUCCESS"
                  ? "bg-emerald-500"
                  : statusData.status === "RUNNING"
                    ? "bg-amber-500 animate-ping"
                    : statusData.status === "FAILED"
                      ? "bg-red-500"
                      : "bg-zinc-400"
              }`}
            />
            {statusData.status}
          </span>

          {statusData.completedAt && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Indexed {new Date(statusData.completedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Embeddings Vectors
        </span>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pt-0.5">
          {statusData.totalEmbeddings} Vector Embeddings
        </p>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Indexing Progress
        </span>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 pt-0.5">
          {statusData.filesProcessed} processed • {statusData.filesSkipped}{" "}
          skipped (cached)
          {statusData.filesFailed > 0 && ` • ${statusData.filesFailed} failed`}
        </p>
      </div>
    </div>
  );
}

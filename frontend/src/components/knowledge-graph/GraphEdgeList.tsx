"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";

export interface GraphEdgeItem {
  id: string;
  repositoryId: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: string;
  sourceNode?: { name: string; type: string };
  targetNode?: { name: string; type: string };
  createdAt: string;
}

interface GraphEdgeListProps {
  repositoryId: string;
}

export function GraphEdgeList({ repositoryId }: GraphEdgeListProps) {
  const [edges, setEdges] = useState<GraphEdgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>("");
  const [totalCount, setTotalCount] = useState(0);

  const fetchEdges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (typeFilter) queryParams.set("type", typeFilter);
      queryParams.set("limit", "50");

      const res = await api.get(
        `/repositories/${repositoryId}/graph/edges?${queryParams.toString()}`,
      );
      setEdges(res.data?.data?.edges || []);
      setTotalCount(res.data?.data?.totalCount || 0);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || "Failed to load graph edges",
      );
    } finally {
      setLoading(false);
    }
  }, [repositoryId, typeFilter]);

  useEffect(() => {
    fetchEdges();
  }, [fetchEdges]);

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Graph Relationships ({totalCount})
        </h3>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm focus:border-cyan-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <option value="">All Edge Types</option>
          <option value="CONTAINS">CONTAINS</option>
          <option value="IMPORTS">IMPORTS</option>
          <option value="DEPENDS_ON">DEPENDS_ON</option>
          <option value="CALLS">CALLS</option>
          <option value="USES">USES</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2 animate-pulse py-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-900"
            />
          ))}
        </div>
      ) : edges.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            No graph relationships found.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          {edges.map((edge) => (
            <div
              key={edge.id}
              className="flex items-center justify-between p-3 text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {edge.sourceNode?.name || edge.sourceNodeId}
                </span>

                <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                  ─── {edge.type} ───►
                </span>

                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {edge.targetNode?.name || edge.targetNodeId}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

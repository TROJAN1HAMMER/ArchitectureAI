"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";

export interface GraphNodeItem {
  id: string;
  repositoryId: string;
  fileId?: string | null;
  type: string;
  name: string;
  qualifiedName: string;
  path?: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface GraphNodeListProps {
  repositoryId: string;
  onSelectNode?: (nodeId: string) => void;
}

export function GraphNodeList({
  repositoryId,
  onSelectNode,
}: GraphNodeListProps) {
  const [nodes, setNodes] = useState<GraphNodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [totalCount, setTotalCount] = useState(0);

  const fetchNodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (typeFilter) queryParams.set("type", typeFilter);
      if (search) queryParams.set("search", search);
      queryParams.set("limit", "50");

      const res = await api.get(
        `/repositories/${repositoryId}/graph/nodes?${queryParams.toString()}`,
      );
      setNodes(res.data?.data?.nodes || []);
      setTotalCount(res.data?.data?.totalCount || 0);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || "Failed to load graph nodes",
      );
    } finally {
      setLoading(false);
    }
  }, [repositoryId, typeFilter, search]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Graph Nodes ({totalCount})
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm focus:border-cyan-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="">All Node Types</option>
            <option value="REPOSITORY">REPOSITORY</option>
            <option value="DIRECTORY">DIRECTORY</option>
            <option value="FILE">FILE</option>
            <option value="MODULE">MODULE</option>
            <option value="CLASS">CLASS</option>
            <option value="FUNCTION">FUNCTION</option>
          </select>

          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm focus:border-cyan-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          />
        </div>
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
      ) : nodes.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            No matching graph nodes found.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => onSelectNode && onSelectNode(node.id)}
              className="flex items-center justify-between p-3 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer transition"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="rounded bg-cyan-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 shrink-0">
                  {node.type}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {node.name}
                </span>
                {node.path && (
                  <span className="font-mono text-zinc-400 dark:text-zinc-500 truncate hidden sm:inline">
                    ({node.path})
                  </span>
                )}
              </div>

              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">
                Inspect ↗
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

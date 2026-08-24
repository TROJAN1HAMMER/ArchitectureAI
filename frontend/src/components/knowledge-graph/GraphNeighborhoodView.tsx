"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";

interface NeighborhoodData {
  centerNode: {
    id: string;
    name: string;
    type: string;
    path?: string | null;
    qualifiedName: string;
  };
  connectedNodes: Array<{
    id: string;
    name: string;
    type: string;
    path?: string | null;
  }>;
  edges: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    type: string;
    direction: "outgoing" | "incoming";
  }>;
}

interface GraphNeighborhoodViewProps {
  repositoryId: string;
  selectedNodeId: string | null;
  onClearSelection?: () => void;
}

export function GraphNeighborhoodView({
  repositoryId,
  selectedNodeId,
  onClearSelection,
}: GraphNeighborhoodViewProps) {
  const [data, setData] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNeighborhood = useCallback(async () => {
    if (!selectedNodeId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(
        `/repositories/${repositoryId}/graph/neighborhood/${selectedNodeId}?depth=1`,
      );
      setData(res.data?.data || null);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Failed to load node neighborhood",
      );
    } finally {
      setLoading(false);
    }
  }, [repositoryId, selectedNodeId]);

  useEffect(() => {
    fetchNeighborhood();
  }, [fetchNeighborhood]);

  if (!selectedNodeId) {
    return (
      <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Select a node from the Graph Nodes list to inspect its connected
          neighborhood relationships.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-48 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 animate-pulse" />
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
        {error || "Failed to load node details."}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-cyan-200 bg-cyan-50/20 p-5 shadow-sm dark:border-cyan-900/30 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-cyan-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
            {data.centerNode.type}
          </span>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {data.centerNode.name}
          </h4>
        </div>

        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Clear Selection ✕
          </button>
        )}
      </div>

      <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
        {data.centerNode.qualifiedName}
      </p>

      <div className="border-t border-cyan-100 dark:border-zinc-800 pt-3">
        <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
          Connected Graph Neighborhood ({data.edges.length} Connections)
        </h5>

        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {data.edges.map((edge) => {
            const connectedNode = data.connectedNodes.find(
              (n) =>
                n.id ===
                (edge.direction === "outgoing"
                  ? edge.targetNodeId
                  : edge.sourceNodeId),
            );

            return (
              <div
                key={edge.id}
                className="flex items-center gap-2 text-xs p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              >
                <span className="text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500">
                  {edge.direction}
                </span>

                <span className="font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  [{edge.type}]
                </span>

                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {connectedNode?.name || "Connected Entity"}
                </span>

                {connectedNode?.type && (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                    ({connectedNode.type})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import api from "@/services/api";
import { RepositorySyncStatus } from "@/components/repository/RepositorySyncStatus";
import { RepositorySyncButton } from "@/components/repository/RepositorySyncButton";
import {
  RepositoryTree,
  RepositoryFileNode,
} from "@/components/repository/RepositoryTree";
import {
  GraphSummary,
  GraphSummaryData,
} from "@/components/knowledge-graph/GraphSummary";
import { GraphBuildButton } from "@/components/knowledge-graph/GraphBuildButton";
import { GraphNodeList } from "@/components/knowledge-graph/GraphNodeList";
import { GraphEdgeList } from "@/components/knowledge-graph/GraphEdgeList";
import { GraphNeighborhoodView } from "@/components/knowledge-graph/GraphNeighborhoodView";

interface RepositoryDetail {
  id: string;
  githubRepositoryId: string;
  name: string;
  fullName: string;
  owner: string;
  ownerLogin: string;
  description: string | null;
  defaultBranch: string;
  visibility: string;
  isPrivate: boolean;
  language: string | null;
  stars: number;
  forks: number;
  isArchived: boolean;
  htmlUrl: string;
  lastSyncedAt: string | null;
  fileCount: number;
  syncStatus: string | null;
}

interface RepositorySyncHistoryItem {
  id: string;
  status: string;
  trigger: string;
  startedAt: string;
  completedAt: string | null;
  filesDiscovered: number;
  filesProcessed: number;
  errorMessage: string | null;
}

export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const repositoryId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<"files" | "graph" | "syncs">(
    "files",
  );

  const [repo, setRepo] = useState<RepositoryDetail | null>(null);
  const [files, setFiles] = useState<RepositoryFileNode[]>([]);
  const [syncs, setSyncs] = useState<RepositorySyncHistoryItem[]>([]);
  const [graphSummary, setGraphSummary] = useState<GraphSummaryData | null>(
    null,
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRepositoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [repoRes, treeRes, syncsRes, graphRes] = await Promise.all([
        api.get(`/repositories/${repositoryId}`),
        api.get(`/repositories/${repositoryId}/tree?limit=500`),
        api.get(`/repositories/${repositoryId}/syncs?limit=5`),
        api.get(`/repositories/${repositoryId}/graph`).catch(() => null),
      ]);

      setRepo(repoRes.data?.data || null);
      setFiles(treeRes.data?.data?.files || []);
      setSyncs(syncsRes.data?.data || []);
      if (graphRes) {
        setGraphSummary(graphRes.data?.data || null);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Failed to load repository details",
      );
    } finally {
      setLoading(false);
    }
  }, [repositoryId]);

  useEffect(() => {
    loadRepositoryData();
  }, [loadRepositoryData]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-6 animate-pulse">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-80 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          <p className="font-semibold">{error || "Repository not found"}</p>
        </div>
        <div className="mt-4">
          <Link
            href="/repositories"
            className="text-sm font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
          >
            ← Back to Repositories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      <div>
        <Link
          href="/repositories"
          className="inline-flex items-center text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-4 transition"
        >
          ← Back to Repositories
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {repo.fullName}
              </h1>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {repo.visibility}
              </span>
              <RepositorySyncStatus
                status={repo.syncStatus}
                filesProcessed={repo.fileCount}
              />
            </div>
            {repo.description && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {repo.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              GitHub ↗
            </a>

            <RepositorySyncButton
              repositoryId={repo.id}
              onSyncComplete={loadRepositoryData}
            />

            <GraphBuildButton
              repositoryId={repo.id}
              onBuildComplete={loadRepositoryData}
            />
          </div>
        </div>
      </div>

      {/* Metadata Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Language
          </span>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {repo.language || "Not specified"}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Default Branch
          </span>
          <p className="mt-1 text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-100">
            {repo.defaultBranch}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            File Count
          </span>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {repo.fileCount} files
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Last Synced
          </span>
          <p className="mt-1 text-xs text-zinc-900 dark:text-zinc-100">
            {repo.lastSyncedAt
              ? new Date(repo.lastSyncedAt).toLocaleString()
              : "Never"}
          </p>
        </div>
      </div>

      {/* Knowledge Graph Summary Badge Header */}
      <GraphSummary summary={graphSummary} />

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("files")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === "files"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          File Tree ({files.length})
        </button>

        <button
          onClick={() => setActiveTab("graph")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === "graph"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          Knowledge Graph ({graphSummary?.nodes || 0} Nodes)
        </button>

        <button
          onClick={() => setActiveTab("syncs")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === "syncs"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          Sync History ({syncs.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "files" && (
        <div className="space-y-4">
          <RepositoryTree files={files} />
        </div>
      )}

      {activeTab === "graph" && (
        <div className="space-y-6">
          <GraphNeighborhoodView
            repositoryId={repo.id}
            selectedNodeId={selectedNodeId}
            onClearSelection={() => setSelectedNodeId(null)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GraphNodeList
              repositoryId={repo.id}
              onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
            />

            <GraphEdgeList repositoryId={repo.id} />
          </div>
        </div>
      )}

      {activeTab === "syncs" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Trigger</th>
                  <th className="px-4 py-3">Files Discovered</th>
                  <th className="px-4 py-3">Started At</th>
                  <th className="px-4 py-3">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {syncs.map((sync) => (
                  <tr key={sync.id}>
                    <td className="px-4 py-3">
                      <RepositorySyncStatus
                        status={sync.status}
                        filesProcessed={sync.filesProcessed}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono">{sync.trigger}</td>
                    <td className="px-4 py-3">{sync.filesDiscovered}</td>
                    <td className="px-4 py-3">
                      {new Date(sync.startedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {sync.completedAt
                        ? new Date(sync.completedAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

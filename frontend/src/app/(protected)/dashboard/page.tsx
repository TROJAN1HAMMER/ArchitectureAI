"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/services/api";
import {
  FolderGit2,
  FileCode2,
  Network,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Layers,
  ShieldCheck,
  Cpu,
} from "lucide-react";

interface DashboardData {
  repositoryCount: number;
  totalIndexedFiles: number;
  totalKnowledgeGraphNodes: number;
  syncedRepositories: number;
  failedSyncs: number;
  githubConnected: boolean;
  githubUsername: string | null;
  repositories: Array<{
    id: string;
    fullName: string;
    language: string | null;
    fileCount: number;
    graphNodeCount: number;
    syncStatus: string | null;
    lastSyncedAt: string | null;
    defaultBranch: string;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/users/dashboard");
      setData(res.data?.data || null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400" />
          <span className="text-sm font-medium">
            Loading workspace intelligence...
          </span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading dashboard</span>
          </div>
          <p className="mt-2">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Architecture Intelligence Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Real-time repository synchronization, structural knowledge graphs,
            and governance audit metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <Link
            href="/repositories"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <FolderGit2 className="h-3.5 w-3.5" /> Connect Repository
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Connected Repositories
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <FolderGit2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {data?.repositoryCount ?? 0}
            </span>
            <span className="text-xs font-medium text-zinc-500">
              {data?.syncedRepositories ?? 0} active syncs
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Total Indexed Files
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <FileCode2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {data?.totalIndexedFiles?.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-medium text-zinc-500">
              source files
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Knowledge Graph Nodes
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Network className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {data?.totalKnowledgeGraphNodes?.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-medium text-zinc-500">
              architectural entities
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              GitHub Integration
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                data?.githubConnected
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
              }`}
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {data?.githubConnected
                ? data.githubUsername
                  ? `@${data.githubUsername}`
                  : "Connected"
                : "Not Connected"}
            </span>
            {data?.githubConnected && (
              <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Ready
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Repository Intelligence List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              Connected Repositories
            </h2>
            <Link
              href="/repositories"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {!data?.repositories || data.repositories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <FolderGit2 className="mx-auto h-10 w-10 text-zinc-400" />
              <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                No repositories connected yet
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Connect your GitHub repository to analyze architecture, generate
                C4 diagrams, and audit governance rules.
              </p>
              <div className="mt-5">
                <Link
                  href="/repositories"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
                >
                  Connect your first repository{" "}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {data.repositories.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/repositories/${repo.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-700/60"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                          {repo.fullName}
                        </span>
                        {repo.language && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {repo.language}
                          </span>
                        )}
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            repo.syncStatus === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : repo.syncStatus === "FAILED"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {repo.syncStatus || "UNSYNCED"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        branch: {repo.defaultBranch} • {repo.fileCount} files •{" "}
                        {repo.graphNodeCount} graph nodes
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 self-end sm:self-center">
                      <span>Open Workspace</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Capabilities & Quick Navigation */}
        <div className="space-y-5">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-500" /> Platform Modules
            </h3>
            <div className="space-y-2 text-xs">
              <Link
                href="/repositories"
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Architecture Governance</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>

              <Link
                href="/repositories"
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                  <Layers className="h-4 w-4 text-cyan-500" />
                  <span>C4 System Design Studio</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>

              <Link
                href="/systems"
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                  <Network className="h-4 w-4 text-purple-500" />
                  <span>Enterprise Topology</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-5 shadow-sm dark:border-zinc-800 dark:from-indigo-950/20 dark:to-purple-950/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Getting Started
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              1. Connect your GitHub account in <strong>Settings</strong> or{" "}
              <strong>Repositories</strong>.
              <br />
              2. Select a repository to index its file tree and construct the
              Knowledge Graph.
              <br />
              3. Run Governance reviews, explore C4 interactive diagrams, and
              execute autonomous refactoring patches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { RepositoryCard, RepositoryData } from "../repository/RepositoryCard";

interface GithubRepo {
  githubRepositoryId: string;
  name: string;
  fullName: string;
  ownerLogin: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  visibility: string;
  isPrivate: boolean;
  connected: boolean;
}

interface RepositoryListProps {
  githubConnected: boolean;
}

export function RepositoryList({ githubConnected }: RepositoryListProps) {
  const [activeTab, setActiveTab] = useState<"connected" | "available">(
    "connected",
  );

  const [connectedRepos, setConnectedRepos] = useState<RepositoryData[]>([]);
  const [availableRepos, setAvailableRepos] = useState<GithubRepo[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchConnected = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/repositories");
      setConnectedRepos(res.data?.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Failed to load connected repositories",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailable = useCallback(
    async (pageNum = 1) => {
      if (!githubConnected) return;
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(
          `/repositories/github?page=${pageNum}&perPage=10`,
        );
        const data = res.data?.data || [];
        setAvailableRepos(data);
        setPage(pageNum);
        setHasMore(data.length === 10);
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            "Failed to load GitHub repositories",
        );
      } finally {
        setLoading(false);
      }
    },
    [githubConnected],
  );

  useEffect(() => {
    if (activeTab === "connected") {
      fetchConnected();
    } else {
      fetchAvailable(1);
    }
  }, [activeTab, fetchConnected, fetchAvailable]);

  const handleConnect = async (repo: GithubRepo) => {
    try {
      setLoading(true);
      await api.post(`/repositories/${repo.githubRepositoryId}/connect`, {
        owner: repo.ownerLogin,
        name: repo.name,
      });
      await fetchAvailable(page);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || "Failed to connect repository",
      );
      setLoading(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to disconnect this repository from ArchitectAI?",
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      await api.delete(`/repositories/${id}/connect`);
      await fetchConnected();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || "Failed to disconnect repository",
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("connected")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === "connected"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          Connected Repositories ({connectedRepos.length})
        </button>
        <button
          onClick={() => setActiveTab("available")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === "available"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
          disabled={!githubConnected}
          title={!githubConnected ? "Connect your GitHub account first" : ""}
        >
          Available on GitHub
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 w-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && activeTab === "connected" && (
        <div className="space-y-4">
          {connectedRepos.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800">
              <p className="text-zinc-500 dark:text-zinc-400">
                No connected repositories. Go to the &quot;Available on
                GitHub&quot; tab to connect repositories!
              </p>
            </div>
          ) : (
            connectedRepos.map((repo) => (
              <RepositoryCard
                key={repo.id}
                repository={repo}
                onSyncComplete={fetchConnected}
                onDisconnect={handleDisconnect}
              />
            ))
          )}
        </div>
      )}

      {!loading && activeTab === "available" && (
        <div className="space-y-4">
          {availableRepos.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800">
              <p className="text-zinc-500 dark:text-zinc-400">
                No repositories found on this GitHub account.
              </p>
            </div>
          ) : (
            <>
              {availableRepos.map((repo) => (
                <div
                  key={repo.githubRepositoryId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {repo.fullName}
                      </span>
                      {repo.isPrivate && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/20 dark:text-red-400">
                          Private
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {repo.description}
                      </p>
                    )}
                  </div>

                  <div>
                    {repo.connected ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/20 dark:text-green-400">
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnect(repo)}
                        className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-zinc-800 transition dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        Connect Repository
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => fetchAvailable(page - 1)}
                  disabled={page === 1}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Previous
                </button>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Page {page}
                </span>
                <button
                  onClick={() => fetchAvailable(page + 1)}
                  disabled={!hasMore}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

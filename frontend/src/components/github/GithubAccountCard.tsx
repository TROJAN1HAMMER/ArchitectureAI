"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/services/api";

interface GithubAccount {
  connected: boolean;
  username?: string;
  email?: string;
  profileUrl?: string;
  githubUserId?: string;
  connectedAt?: string;
}

interface GithubAccountCardProps {
  onAccountChange: (connected: boolean) => void;
}

function AccountCardContent({ onAccountChange }: GithubAccountCardProps) {
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<GithubAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/github/account");
      const data = res.data?.data;
      setAccount(data);
      onAccountChange(!!data?.connected);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Failed to load GitHub account status",
      );
    } finally {
      setLoading(false);
    }
  }, [onAccountChange]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const connectedParam = searchParams.get("connected");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
    if (connectedParam === "true") {
      fetchAccount();
    }
  }, [searchParams, fetchAccount]);

  const handleConnect = async () => {
    try {
      setError(null);
      const res = await api.get("/github/connect");
      const url = res.data?.data?.url;
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Failed to initiate GitHub connection",
      );
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect your GitHub account? This will revoke all repository connections.",
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      await api.delete("/github/account");
      setAccount({ connected: false });
      onAccountChange(false);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Failed to disconnect GitHub account",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 animate-pulse">
        <div className="h-6 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800 mb-4" />
        <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            GitHub Integration
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Connect your GitHub account to import and sync repositories.
          </p>
        </div>

        <div>
          {account?.connected ? (
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
            >
              Disconnect Account
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-zinc-800 transition dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Connect GitHub
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {account?.connected && (
        <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Connected Profile
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <a
                  href={account.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  @{account.username}
                </a>
              </dd>
            </div>
            {account.email && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  GitHub Email
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {account.email}
                </dd>
              </div>
            )}
            {account.connectedAt && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Connected On
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(account.connectedAt).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

export function GithubAccountCard(props: GithubAccountCardProps) {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 animate-pulse">
          <div className="h-6 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800 mb-4" />
        </div>
      }
    >
      <AccountCardContent {...props} />
    </Suspense>
  );
}

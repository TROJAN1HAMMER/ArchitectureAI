"use client";

import React, { useState } from "react";
import api from "@/services/api";

interface RepositorySyncButtonProps {
  repositoryId: string;
  onSyncComplete?: () => void;
  variant?: "small" | "default";
}

export function RepositorySyncButton({
  repositoryId,
  onSyncComplete,
  variant = "default",
}: RepositorySyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setLoading(true);
      setError(null);
      await api.post(`/repositories/${repositoryId}/sync`);
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("Sync is already running");
      } else {
        setError(
          err.response?.data?.error?.message || "Sync failed to initiate",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isSmall = variant === "small";

  return (
    <div className="inline-flex flex-col items-end">
      <button
        onClick={handleSync}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
          isSmall ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs sm:text-sm"
        }`}
      >
        {loading ? (
          <>
            <svg
              className="h-3.5 w-3.5 animate-spin text-zinc-600 dark:text-zinc-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Syncing...
          </>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Sync Repository
          </>
        )}
      </button>

      {error && (
        <span className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}

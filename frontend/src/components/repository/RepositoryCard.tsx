"use client";

import React from "react";
import Link from "next/link";
import { RepositorySyncStatus } from "./RepositorySyncStatus";
import { RepositorySyncButton } from "./RepositorySyncButton";

export interface RepositoryData {
  id: string;
  githubRepositoryId: string;
  name: string;
  fullName: string;
  owner: string;
  description?: string | null;
  visibility: string;
  defaultBranch: string;
  language?: string | null;
  stars?: number;
  forks?: number;
  isArchived?: boolean;
  url: string;
  connectedAt?: string;
  lastSyncedAt?: string | null;
  fileCount?: number;
  syncStatus?: string | null;
}

interface RepositoryCardProps {
  repository: RepositoryData;
  onSyncComplete?: () => void;
  onDisconnect?: (id: string) => void;
}

export function RepositoryCard({
  repository,
  onSyncComplete,
  onDisconnect,
}: RepositoryCardProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="space-y-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/repositories/${repository.id}`}
            className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
          >
            {repository.fullName}
          </Link>

          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {repository.visibility}
          </span>

          {repository.isArchived && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
              Archived
            </span>
          )}

          <RepositorySyncStatus
            status={repository.syncStatus ?? null}
            filesProcessed={repository.fileCount}
          />
        </div>

        {repository.description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
            {repository.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
          {repository.language && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              {repository.language}
            </span>
          )}

          <span>
            Branch:{" "}
            <code className="font-mono">{repository.defaultBranch}</code>
          </span>

          {typeof repository.fileCount === "number" && (
            <span>{repository.fileCount} files</span>
          )}

          {typeof repository.stars === "number" && repository.stars > 0 && (
            <span>★ {repository.stars}</span>
          )}

          {repository.lastSyncedAt && (
            <span>
              Last synced: {new Date(repository.lastSyncedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:self-center">
        <Link
          href={`/repositories/${repository.id}`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          View Details
        </Link>

        <RepositorySyncButton
          repositoryId={repository.id}
          onSyncComplete={onSyncComplete}
          variant="small"
        />

        {onDisconnect && (
          <button
            onClick={() => onDisconnect(repository.id)}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50 transition dark:border-red-900/30 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/20"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}

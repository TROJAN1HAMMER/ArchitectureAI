import React from "react";
import { FolderGit2, Star } from "lucide-react";

export function TopologyRepositories({
  repositories,
  onRemove,
}: {
  repositories: Array<{
    id: string;
    name: string;
    fullName: string;
    role: string;
    language?: string;
    stars?: number;
  }>;
  onRemove?: (repoId: string) => void;
}) {
  if (!repositories || repositories.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No repositories added to this system yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {repositories.map((repo) => (
        <div
          key={repo.id}
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <FolderGit2 className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {repo.name}
              </h4>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] uppercase dark:bg-zinc-800">
                  {repo.role}
                </span>
                {repo.language && <span>{repo.language}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {repo.stars !== undefined && (
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {repo.stars}
              </span>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(repo.id)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

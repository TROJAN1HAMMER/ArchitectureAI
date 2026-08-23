"use client";

import React, { useState } from "react";
import { GithubAccountCard } from "@/components/github/GithubAccountCard";
import { RepositoryList } from "@/components/github/RepositoryList";

export default function Repositories() {
  const [githubConnected, setGithubConnected] = useState(false);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Repositories
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Manage and connect your repositories to ArchitectAI.
        </p>
      </div>

      <GithubAccountCard onAccountChange={setGithubConnected} />

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
          Repository Connections
        </h2>
        <RepositoryList githubConnected={githubConnected} />
      </div>
    </div>
  );
}

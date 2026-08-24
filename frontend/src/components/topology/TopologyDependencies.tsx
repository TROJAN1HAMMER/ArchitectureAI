import React from "react";
import { DependencyConfidenceBadge } from "./DependencyConfidenceBadge";
import { ArrowRight, Link } from "lucide-react";

export interface DependencyItem {
  id: string;
  sourceRepository: { id: string; name: string; role: string };
  targetRepository: { id: string; name: string; role: string };
  type: string;
  confidence: string;
  evidence?: Record<string, any>;
}

export function TopologyDependencies({
  dependencies,
}: {
  dependencies: DependencyItem[];
}) {
  if (!dependencies || dependencies.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No inter-repository dependencies discovered yet. Run topology analysis
        to discover cross-service relationships.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {dependencies.map((dep) => (
        <div
          key={dep.id}
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <Link className="h-4 w-4 text-indigo-500" />
            <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
              <span>{dep.sourceRepository.name}</span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
                {dep.sourceRepository.role}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              <span>{dep.targetRepository.name}</span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
                {dep.targetRepository.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 font-mono text-indigo-400">
              {dep.type}
            </span>
            <DependencyConfidenceBadge confidence={dep.confidence} />
          </div>
        </div>
      ))}
    </div>
  );
}

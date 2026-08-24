"use client";

import React from "react";
import { FileCode } from "lucide-react";

interface Patch {
  id: string;
  filePath: string;
  diff: string;
}

interface RemediationDiffViewerProps {
  patches: Patch[];
}

export const RemediationDiffViewer: React.FC<RemediationDiffViewerProps> = ({
  patches,
}) => {
  if (!patches || patches.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No code patches generated yet. Click &quot;Generate Patch&quot; to
        create a proposed refactoring diff.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {patches.map((patch) => (
        <div
          key={patch.id}
          className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center gap-2 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
            <FileCode className="h-4 w-4 text-indigo-500" />
            <span>{patch.filePath}</span>
          </div>
          <pre className="overflow-x-auto bg-zinc-950 p-3 font-mono text-xs text-zinc-200">
            {patch.diff.split("\n").map((line, idx) => {
              let lineStyle = "text-zinc-400";
              if (line.startsWith("+"))
                lineStyle = "bg-emerald-500/10 text-emerald-400 font-semibold";
              else if (line.startsWith("-"))
                lineStyle = "bg-red-500/10 text-red-400 font-semibold";
              else if (line.startsWith("@")) lineStyle = "text-indigo-400";

              return (
                <div key={idx} className={lineStyle}>
                  {line}
                </div>
              );
            })}
          </pre>
        </div>
      ))}
    </div>
  );
};

"use client";

import React from "react";
import { CheckCircle2, XCircle, Terminal } from "lucide-react";

interface ValidationRecord {
  id: string;
  command: string;
  passed: boolean;
  durationMs?: number;
  output?: string;
}

interface RemediationValidationProps {
  validations: ValidationRecord[];
}

export const RemediationValidation: React.FC<RemediationValidationProps> = ({
  validations,
}) => {
  if (!validations || validations.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No sandbox validation runs completed yet. Click &quot;Run
        Validation&quot; to execute automated typecheck, lint, and test checks.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {validations.map((v) => (
        <div
          key={v.id}
          className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono">
              <Terminal className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {v.command}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {v.durationMs && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  {v.durationMs}ms
                </span>
              )}
              {v.passed ? (
                <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                  <XCircle className="h-3.5 w-3.5" /> Failed
                </span>
              )}
            </div>
          </div>
          {v.output && (
            <pre className="mt-2 max-h-32 overflow-y-auto rounded bg-zinc-950 p-2 font-mono text-[11px] text-zinc-300">
              {v.output}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
};

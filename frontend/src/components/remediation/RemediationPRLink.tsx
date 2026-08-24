"use client";

import React from "react";
import { GitPullRequest, ShieldAlert, ExternalLink } from "lucide-react";

interface ExecutionRecord {
  id: string;
  branchName: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  status: string;
}

interface RemediationPRLinkProps {
  execution: ExecutionRecord;
}

export const RemediationPRLink: React.FC<RemediationPRLinkProps> = ({
  execution,
}) => {
  return (
    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
          <GitPullRequest className="h-4 w-4" />
          <span>Pull Request Created</span>
        </div>
        {execution.pullRequestUrl && (
          <a
            href={execution.pullRequestUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-blue-500 hover:underline"
          >
            Open PR #{execution.pullRequestNumber || ""}{" "}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="font-mono text-zinc-600 dark:text-zinc-400">
        Branch:{" "}
        <span className="font-bold text-zinc-800 dark:text-zinc-200">
          {execution.branchName}
        </span>
      </div>

      <div className="flex items-start gap-2 rounded bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400 text-[11px] border border-amber-500/20">
        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          <strong>Human Approval Boundary:</strong> ArchitectAI did NOT
          automatically merge this pull request. Final merge approval requires
          human review.
        </span>
      </div>
    </div>
  );
};

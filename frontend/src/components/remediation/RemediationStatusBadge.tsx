"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  GitPullRequest,
  Loader2,
} from "lucide-react";

interface RemediationStatusBadgeProps {
  status: string;
}

export const RemediationStatusBadge: React.FC<RemediationStatusBadgeProps> = ({
  status,
}) => {
  switch (status) {
    case "APPLIED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500 border border-blue-500/20">
          <GitPullRequest className="h-3.5 w-3.5" />
          PR Created
        </span>
      );
    case "READY":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ready for PR
        </span>
      );
    case "GENERATING":
    case "VALIDATING":
    case "PLANNING":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-500 border border-indigo-500/20 animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {status}
        </span>
      );
    case "FAILED":
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500 border border-red-500/20">
          <XCircle className="h-3.5 w-3.5" />
          {status}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 border border-zinc-500/20">
          <Clock className="h-3.5 w-3.5" />
          Proposed
        </span>
      );
  }
};

"use client";

import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

interface GovernanceStatusProps {
  status:
    "PASS" | "PASS_WITH_WARNINGS" | "FAILED" | "NOT_RUN" | "NOT_READY" | string;
}

export const GovernanceStatusBadge: React.FC<GovernanceStatusProps> = ({
  status,
}) => {
  switch (status) {
    case "PASS":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> GOVERNANCE PASSED
        </span>
      );
    case "PASS_WITH_WARNINGS":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" /> PASSED WITH WARNINGS
        </span>
      );
    case "NOT_RUN":
    case "NOT_READY":
    case "ANALYSIS_REQUIRED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/30">
          <Clock className="w-3.5 h-3.5" /> REVIEW NOT RUN
        </span>
      );
    case "FAILED":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <XCircle className="w-3.5 h-3.5" /> GOVERNANCE FAILED
        </span>
      );
  }
};

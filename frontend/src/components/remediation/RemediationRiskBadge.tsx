"use client";

import React from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

interface RemediationRiskBadgeProps {
  riskLevel: string;
}

export const RemediationRiskBadge: React.FC<RemediationRiskBadgeProps> = ({
  riskLevel,
}) => {
  switch (riskLevel) {
    case "CRITICAL":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500 border border-red-500/20">
          <ShieldAlert className="h-3.5 w-3.5" />
          Critical Risk
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-500 border border-orange-500/20">
          <AlertTriangle className="h-3.5 w-3.5" />
          High Risk
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-500 border border-yellow-500/20">
          <AlertTriangle className="h-3.5 w-3.5" />
          Medium Risk
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
          <ShieldCheck className="h-3.5 w-3.5" />
          Low Risk
        </span>
      );
  }
};

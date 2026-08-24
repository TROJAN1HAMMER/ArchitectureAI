"use client";

import React from "react";
import { GovernanceStatusBadge } from "./GovernanceStatus";
import { GovernanceRiskDelta } from "./GovernanceRiskDelta";
import { AlertCircle } from "lucide-react";

export interface GovernanceSummaryData {
  repositoryId: string;
  reviewStatus: string;
  currentRiskScore: number;
  riskDelta: number;
  latestSnapshotVersion: number;
  openViolationsCount: number;
  criticalViolationsCount: number;
  lastReviewedAt: string | null;
  latestDiff?: any;
}

interface GovernanceOverviewProps {
  summary: GovernanceSummaryData | null;
}

export const GovernanceOverview: React.FC<GovernanceOverviewProps> = ({
  summary,
}) => {
  if (!summary) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gray-900/80 border border-gray-800 rounded-xl shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <GovernanceStatusBadge status={summary.reviewStatus} />
            <span className="text-xs text-gray-400 font-mono">
              Snapshot v{summary.latestSnapshotVersion}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Automated architecture review and governance policy evaluation.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-gray-400 font-medium">
              Architecture Risk
            </div>
            <GovernanceRiskDelta
              currentRisk={summary.currentRiskScore}
              delta={summary.riskDelta}
            />
          </div>

          <div className="border-l border-gray-800 pl-6">
            <div className="text-xs text-gray-400 font-medium">
              Open Violations
            </div>
            <div className="text-xl font-bold text-white flex items-center gap-1.5 mt-0.5">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              {summary.openViolationsCount}{" "}
              <span className="text-xs text-rose-400 font-normal">
                ({summary.criticalViolationsCount} Critical)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

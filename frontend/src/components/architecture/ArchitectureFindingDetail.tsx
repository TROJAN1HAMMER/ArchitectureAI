"use client";

import React, { useState } from "react";
import {
  X,
  FileCode,
  ShieldAlert,
  Wrench,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { FindingItem } from "./ArchitectureFindings";
import api from "@/services/api";

interface ArchitectureFindingDetailProps {
  finding: FindingItem | null;
  repositoryId?: string;
  onClose: () => void;
  onPlanCreated?: () => void;
}

export const ArchitectureFindingDetail: React.FC<
  ArchitectureFindingDetailProps
> = ({ finding, repositoryId, onClose, onPlanCreated }) => {
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [planSuccess, setPlanSuccess] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  if (!finding) return null;

  const handleProposeRemediation = async () => {
    if (!repositoryId) return;
    try {
      setCreatingPlan(true);
      setPlanError(null);
      await api.post(`/repositories/${repositoryId}/remediations`, {
        findingId: finding.id,
      });
      setPlanSuccess(true);
      if (onPlanCreated) {
        onPlanCreated();
      }
    } catch (err: any) {
      setPlanError(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          err.message ||
          "Failed to create remediation plan",
      );
    } finally {
      setCreatingPlan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded border bg-amber-500/20 text-amber-400 border-amber-500/30">
              {finding.severity}
            </span>
            <span className="text-xs font-mono text-indigo-300">
              {finding.type}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">{finding.title}</h2>
        </div>

        <div className="text-xs text-gray-300 bg-gray-950/80 p-4 rounded-xl border border-gray-800 leading-relaxed">
          {finding.description}
        </div>

        {finding.evidence && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" /> Evidence
              Details & Context
            </h4>
            <pre className="p-3 bg-gray-950 text-[11px] font-mono text-indigo-200 rounded-xl border border-gray-800 overflow-x-auto">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
          </div>
        )}

        {planError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {planError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-800 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-gray-500" /> Finding
            Confidence:{" "}
            <span className="text-gray-200 font-semibold">
              {Math.round(finding.confidence * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            {repositoryId && (
              <button
                onClick={handleProposeRemediation}
                disabled={creatingPlan || planSuccess}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {creatingPlan ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Proposing
                    Plan...
                  </>
                ) : planSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{" "}
                    Plan Proposed
                  </>
                ) : (
                  <>
                    <Wrench className="w-3.5 h-3.5" /> Propose Remediation Plan
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Close Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

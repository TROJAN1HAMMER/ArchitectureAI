"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { RemediationPlanCard, Plan } from "./RemediationPlanCard";
import { FindingItem } from "@/components/architecture/ArchitectureFindings";
import {
  Wrench,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Sparkles,
  ArrowRight,
  PlusCircle,
} from "lucide-react";

interface RemediationOverviewProps {
  repositoryId: string;
  findings?: FindingItem[];
  onTriggerAnalysis?: () => void;
}

export const RemediationOverview: React.FC<RemediationOverviewProps> = ({
  repositoryId,
  findings = [],
  onTriggerAnalysis,
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [proposingFindingId, setProposingFindingId] = useState<string | null>(
    null,
  );

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/repositories/${repositoryId}/remediations`);
      setPlans(res.data?.data || res.data || []);
    } catch (err: any) {
      setError(
        err.friendlyMessage ||
          err.message ||
          "Failed to load remediation plans",
      );
    } finally {
      setLoading(false);
    }
  }, [repositoryId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleProposePlan = async (findingId: string) => {
    try {
      setProposingFindingId(findingId);
      await api.post(`/repositories/${repositoryId}/remediations`, {
        findingId,
      });
      await fetchPlans();
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          err.friendlyMessage ||
          err.message ||
          "Failed to create remediation plan",
      );
    } finally {
      setProposingFindingId(null);
    }
  };

  const handleGenerate = async (planId: string) => {
    try {
      await api.post(
        `/repositories/${repositoryId}/remediations/${planId}/generate`,
      );
      await fetchPlans();
    } catch (err: any) {
      alert(err.friendlyMessage || err.message || "Failed to generate patch");
    }
  };

  const handleValidate = async (planId: string) => {
    try {
      await api.post(
        `/repositories/${repositoryId}/remediations/${planId}/validate`,
      );
      await fetchPlans();
    } catch (err: any) {
      alert(err.friendlyMessage || err.message || "Validation failed");
    }
  };

  const handleExecute = async (planId: string) => {
    try {
      await api.post(
        `/repositories/${repositoryId}/remediations/${planId}/execute`,
      );
      await fetchPlans();
    } catch (err: any) {
      alert(err.friendlyMessage || err.message || "PR creation failed");
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "LOW":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-xs text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
        <span>Loading Autonomous Remediation Plans...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            <Wrench className="h-5 w-5 text-amber-500" /> Autonomous Remediation
            & Refactoring Plans
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Synthesize safe AST refactoring patches, validate changes in
            sandbox, and open GitHub PRs for architectural findings.
          </p>
        </div>

        <button
          onClick={fetchPlans}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 transition self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-xs text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      {/* Unaddressed Findings Section (Connecting Audit to Remediation) */}
      {findings.length > 0 && (
        <div className="bg-gray-900/60 border border-amber-500/30 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                Findings Available for Autonomous Remediation ({findings.length}
                )
              </h3>
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:inline">
              Select a finding to synthesize an automated refactoring proposal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {findings.map((f) => (
              <div
                key={f.id}
                className="p-3.5 bg-gray-950/80 border border-gray-800 rounded-xl flex flex-col justify-between gap-3 hover:border-gray-700 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getSeverityBadge(
                        f.severity,
                      )}`}
                    >
                      {f.severity}
                    </span>
                    <span className="text-[11px] font-mono text-indigo-300">
                      {f.type}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white leading-snug">
                    {f.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 line-clamp-2">
                    {f.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">
                    Confidence: {Math.round(f.confidence * 100)}%
                  </span>
                  <button
                    onClick={() => handleProposePlan(f.id)}
                    disabled={proposingFindingId === f.id}
                    className="px-2.5 py-1 bg-amber-600/90 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    {proposingFindingId === f.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />{" "}
                        Generating...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3 h-3" /> Propose Plan
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Remediation Plans */}
      {plans.length === 0 ? (
        findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-800 bg-gray-950/40">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No Architectural Findings or Active Plans
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 leading-relaxed">
              Run an Architecture Audit to analyze coupling, cycles, and
              boundary violations, which can then be automatically remediated
              with targeted refactoring plans.
            </p>
            {onTriggerAnalysis && (
              <button
                onClick={onTriggerAnalysis}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-1.5"
              >
                Analyze Architecture <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : null
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" /> Active Remediation
            Proposals ({plans.length})
          </h3>
          {plans.map((plan) => (
            <RemediationPlanCard
              key={plan.id}
              plan={plan}
              onGenerate={handleGenerate}
              onValidate={handleValidate}
              onExecute={handleExecute}
            />
          ))}
        </div>
      )}
    </div>
  );
};

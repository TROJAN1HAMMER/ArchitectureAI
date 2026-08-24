"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { RemediationPlanCard, Plan } from "./RemediationPlanCard";
import { Wrench, ShieldCheck, RefreshCw, Loader2 } from "lucide-react";

interface RemediationOverviewProps {
  repositoryId: string;
}

export const RemediationOverview: React.FC<RemediationOverviewProps> = ({
  repositoryId,
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            <Wrench className="h-5 w-5 text-indigo-500" /> Autonomous
            Remediation & Refactoring Plans
          </h2>
          <p className="text-xs text-zinc-500">
            Propose, generate, sandbox validate, and create PRs for
            architectural findings.
          </p>
        </div>

        <button
          onClick={fetchPlans}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-xs text-red-500 border border-red-500/20">
          {error}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No Active Remediation Plans
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            Run an Architecture Audit finding scan to propose automated
            refactoring plans for circular dependencies, boundary violations,
            and coupling issues.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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

"use client";

import React, { useState } from "react";
import { RemediationRiskBadge } from "./RemediationRiskBadge";
import { RemediationStatusBadge } from "./RemediationStatusBadge";
import { RemediationDiffViewer } from "./RemediationDiffViewer";
import { RemediationValidation } from "./RemediationValidation";
import { RemediationPRLink } from "./RemediationPRLink";
import {
  Wrench,
  Play,
  GitPullRequest,
  Code,
  Terminal,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

export interface Plan {
  id: string;
  type: string;
  status: string;
  riskLevel: string;
  title: string;
  description: string;
  rationale: string;
  affectedFiles?: string[];
  errorMessage?: string;
  patches?: any[];
  validations?: any[];
  executions?: any[];
}

interface RemediationPlanCardProps {
  plan: Plan;
  onGenerate: (planId: string) => Promise<void>;
  onValidate: (planId: string) => Promise<void>;
  onExecute: (planId: string) => Promise<void>;
}

export const RemediationPlanCard: React.FC<RemediationPlanCardProps> = ({
  plan,
  onGenerate,
  onValidate,
  onExecute,
}) => {
  const [activeTab, setActiveTab] = useState<"diff" | "validation">("diff");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const execution =
    plan.executions && plan.executions.length > 0 ? plan.executions[0] : null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(plan.id);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      await onValidate(plan.id);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await onExecute(plan.id);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-indigo-500">
              {plan.type}
            </span>
            <RemediationRiskBadge riskLevel={plan.riskLevel} />
            <RemediationStatusBadge status={plan.status} />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {plan.title}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {plan.description}
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300">
        <strong className="text-zinc-800 dark:text-zinc-200">Rationale:</strong>{" "}
        {plan.rationale}
      </div>

      {plan.errorMessage && (
        <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-500 border border-red-500/20 font-mono">
          {plan.errorMessage}
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("diff")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "diff"
                    ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <Code className="h-3.5 w-3.5" /> Proposed Diff (
                {plan.patches?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("validation")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "validation"
                    ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <Terminal className="h-3.5 w-3.5" /> Validations (
                {plan.validations?.length || 0})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || plan.status === "APPLIED"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wrench className="h-3.5 w-3.5" />
                )}
                Generate Patch
              </button>

              <button
                onClick={handleValidate}
                disabled={
                  isValidating ||
                  !plan.patches?.length ||
                  plan.status === "APPLIED"
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isValidating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Run Validation
              </button>

              <button
                onClick={handleExecute}
                disabled={isExecuting || plan.status !== "READY"}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {isExecuting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <GitPullRequest className="h-3.5 w-3.5" />
                )}
                Create Pull Request
              </button>
            </div>
          </div>

          {activeTab === "diff" && (
            <RemediationDiffViewer patches={plan.patches || []} />
          )}
          {activeTab === "validation" && (
            <RemediationValidation validations={plan.validations || []} />
          )}
          {execution && <RemediationPRLink execution={execution} />}
        </div>
      )}
    </div>
  );
};

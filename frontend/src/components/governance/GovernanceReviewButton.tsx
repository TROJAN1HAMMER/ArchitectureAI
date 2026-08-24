"use client";

import React, { useState } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";

interface GovernanceReviewButtonProps {
  repositoryId: string;
  onReviewCompleted: () => void;
  isRunning?: boolean;
}

export const GovernanceReviewButton: React.FC<GovernanceReviewButtonProps> = ({
  repositoryId,
  onReviewCompleted,
  isRunning = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReview = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/v1/repositories/${repositoryId}/governance/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (res.status === 409) {
        setErrorMsg("Governance review is already in progress.");
      } else if (!res.ok) {
        throw new Error("Failed to execute governance review.");
      } else {
        onReviewCompleted();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Review request failed.");
    } finally {
      setLoading(false);
    }
  };

  const active = loading || isRunning;

  return (
    <div className="flex items-center gap-3">
      {errorMsg && (
        <span className="text-xs text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
          {errorMsg}
        </span>
      )}
      <button
        onClick={handleReview}
        disabled={active}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
      >
        {active ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running Governance
            Review...
          </>
        ) : (
          <>
            <ShieldAlert className="w-3.5 h-3.5" /> Run Governance Review
          </>
        )}
      </button>
    </div>
  );
};

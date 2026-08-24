"use client";

import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import api from "@/services/api";

interface SystemDesignGenerateButtonProps {
  repositoryId: string;
  onGenerateStarted: () => void;
  isRunning?: boolean;
}

export const SystemDesignGenerateButton: React.FC<
  SystemDesignGenerateButtonProps
> = ({ repositoryId, onGenerateStarted, isRunning = false }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      await api.post(`/repositories/${repositoryId}/system-design/generate`);
      onGenerateStarted();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMsg("Generation is already in progress.");
      } else {
        setErrorMsg(
          err.response?.data?.message ||
            err.response?.data?.error?.message ||
            err.message ||
            "Failed to generate system design.",
        );
      }
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
        onClick={handleGenerate}
        disabled={active}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800/50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition shadow-lg shadow-cyan-600/20"
      >
        {active ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating System
            Design...
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" /> Generate System Design
          </>
        )}
      </button>
    </div>
  );
};

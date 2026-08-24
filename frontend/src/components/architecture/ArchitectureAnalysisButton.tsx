import React, { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import api from "@/services/api";

interface ArchitectureAnalysisButtonProps {
  repositoryId: string;
  onAnalysisStarted: () => void;
  isRunning?: boolean;
}

export const ArchitectureAnalysisButton: React.FC<
  ArchitectureAnalysisButtonProps
> = ({ repositoryId, onAnalysisStarted, isRunning = false }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      await api.post(`/repositories/${repositoryId}/architecture/analyze`);
      onAnalysisStarted();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorMsg("Analysis is already in progress.");
      } else {
        setErrorMsg(
          err.response?.data?.message ||
            err.response?.data?.error?.message ||
            err.message ||
            "Failed to trigger architecture analysis.",
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
        onClick={handleRun}
        disabled={active}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
      >
        {active ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing
            Architecture...
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" /> Analyze Architecture
          </>
        )}
      </button>
    </div>
  );
};

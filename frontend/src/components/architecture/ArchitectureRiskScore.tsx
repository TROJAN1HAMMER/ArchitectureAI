"use client";

import React from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface ArchitectureRiskScoreProps {
  score: number;
  level: string;
  explanation?: string;
}

export const ArchitectureRiskScore: React.FC<ArchitectureRiskScoreProps> = ({
  score,
  level,
  explanation,
}) => {
  const getBadgeColor = (lvl: string) => {
    switch (lvl.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "ELEVATED":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "MODERATE":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  return (
    <div className="p-6 bg-gray-900/60 border border-gray-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-indigo-500/30 bg-gray-950">
          <span className="text-2xl font-black text-white">{score}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              Structural Risk Level
            </h3>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full border ${getBadgeColor(
                level,
              )}`}
            >
              {level}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-md">
            {explanation ||
              "Heuristic metric derived from coupling, graph cycles, and boundary violations."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        {score < 40 ? (
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" /> Architecture passes structural
            thresholds
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" /> Structural risk warrants
            attention
          </div>
        )}
      </div>
    </div>
  );
};

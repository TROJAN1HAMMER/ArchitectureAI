"use client";

import React from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface GovernanceRiskDeltaProps {
  currentRisk: number;
  delta: number;
}

export const GovernanceRiskDelta: React.FC<GovernanceRiskDeltaProps> = ({
  currentRisk,
  delta,
}) => {
  const getTrend = () => {
    if (delta > 0.1)
      return {
        label: "Degraded",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        icon: TrendingUp,
      };
    if (delta < -0.1)
      return {
        label: "Improved",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        icon: TrendingDown,
      };
    return {
      label: "Unchanged",
      color: "text-gray-400 bg-gray-800/50 border-gray-700",
      icon: Minus,
    };
  };

  const trend = getTrend();
  const Icon = trend.icon;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-white">
        {currentRisk.toFixed(1)}
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${trend.color}`}
      >
        <Icon className="w-3 h-3" />
        {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} ({trend.label})
      </span>
    </div>
  );
};

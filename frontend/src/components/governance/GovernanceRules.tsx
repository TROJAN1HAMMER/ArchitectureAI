"use client";

import React from "react";
import { ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";

export interface GovernanceRuleItem {
  id: string;
  name: string;
  description: string;
  ruleType: string;
  severity: string;
  enabled: boolean;
  configuration?: any;
}

interface GovernanceRulesProps {
  rules: GovernanceRuleItem[];
  onToggleRule: (ruleId: string, enabled: boolean) => void;
}

export const GovernanceRules: React.FC<GovernanceRulesProps> = ({
  rules,
  onToggleRule,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Governance
        Rules ({rules.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl flex items-start justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-xs">
                  {rule.name}
                </span>
                <span className="px-2 py-0.5 font-mono text-[9px] font-bold uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {rule.severity}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {rule.description}
              </p>
            </div>

            <button
              onClick={() => onToggleRule(rule.id, !rule.enabled)}
              className="text-gray-400 hover:text-white transition p-1"
            >
              {rule.enabled ? (
                <ToggleRight className="w-6 h-6 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

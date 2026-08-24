"use client";

import React, { useState } from "react";
import { TopologyRiskScore } from "./TopologyRiskScore";
import { TopologyGraph } from "./TopologyGraph";
import { TopologyRepositories } from "./TopologyRepositories";
import { TopologyDependencies } from "./TopologyDependencies";
import { TopologyFindings } from "./TopologyFindings";
import { TopologyHistory } from "./TopologyHistory";
import {
  Network,
  Play,
  Layers,
  Link,
  AlertTriangle,
  History,
} from "lucide-react";

export function EnterpriseSystemOverview({
  systemData,
  onRunAnalysis,
  analyzing,
}: {
  systemData: any;
  onRunAnalysis: () => void;
  analyzing: boolean;
}) {
  const [activeSubTab, setActiveSubTab] = useState<
    "graph" | "repos" | "deps" | "findings" | "history"
  >("graph");

  if (!systemData) return null;

  const latestAnalysis = systemData.analyses?.[0] || null;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {systemData.name}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {systemData.description ||
              "Multi-repository Enterprise System Topology"}
          </p>
        </div>

        <button
          onClick={onRunAnalysis}
          disabled={analyzing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {analyzing
            ? "Analyzing Enterprise Topology..."
            : "Run Topology Analysis"}
        </button>
      </div>

      {/* Risk Summary */}
      {latestAnalysis && (
        <TopologyRiskScore
          riskScore={latestAnalysis.riskScore}
          riskLevel={latestAnalysis.riskLevel}
          factorBreakdown={latestAnalysis.factorBreakdown}
        />
      )}

      {/* Sub Tab Navigation */}
      <div className="flex border-b border-zinc-200 text-xs font-medium dark:border-zinc-800">
        <button
          onClick={() => setActiveSubTab("graph")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeSubTab === "graph"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          <Network className="h-4 w-4" />
          Topology Graph
        </button>

        <button
          onClick={() => setActiveSubTab("repos")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeSubTab === "repos"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          <Layers className="h-4 w-4" />
          Repositories ({systemData.repositories?.length || 0})
        </button>

        <button
          onClick={() => setActiveSubTab("deps")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeSubTab === "deps"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          <Link className="h-4 w-4" />
          Dependencies ({systemData.dependencies?.length || 0})
        </button>

        <button
          onClick={() => setActiveSubTab("findings")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeSubTab === "findings"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Findings ({systemData.findings?.length || 0})
        </button>

        <button
          onClick={() => setActiveSubTab("history")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeSubTab === "history"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          <History className="h-4 w-4" />
          History
        </button>
      </div>

      {/* Sub Tab Views */}
      <div>
        {activeSubTab === "graph" && (
          <TopologyGraph
            nodes={systemData.repositories || []}
            edges={systemData.dependencies || []}
          />
        )}
        {activeSubTab === "repos" && (
          <TopologyRepositories repositories={systemData.repositories || []} />
        )}
        {activeSubTab === "deps" && (
          <TopologyDependencies dependencies={systemData.dependencies || []} />
        )}
        {activeSubTab === "findings" && (
          <TopologyFindings findings={systemData.findings || []} />
        )}
        {activeSubTab === "history" && (
          <TopologyHistory history={systemData.analyses || []} />
        )}
      </div>
    </div>
  );
}

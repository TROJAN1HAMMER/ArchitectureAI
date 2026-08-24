"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import api from "@/services/api";
import { RepositorySyncStatus } from "@/components/repository/RepositorySyncStatus";
import { RepositorySyncButton } from "@/components/repository/RepositorySyncButton";
import {
  RepositoryTree,
  RepositoryFileNode,
} from "@/components/repository/RepositoryTree";
import {
  GraphSummary,
  GraphSummaryData,
} from "@/components/knowledge-graph/GraphSummary";
import { GraphBuildButton } from "@/components/knowledge-graph/GraphBuildButton";
import { GraphNodeList } from "@/components/knowledge-graph/GraphNodeList";
import { GraphEdgeList } from "@/components/knowledge-graph/GraphEdgeList";
import { GraphNeighborhoodView } from "@/components/knowledge-graph/GraphNeighborhoodView";
import {
  SemanticIndexStatus,
  SemanticIndexStatusData,
} from "@/components/semantic-search/SemanticIndexStatus";
import { SemanticIndexButton } from "@/components/semantic-search/SemanticIndexButton";
import { SemanticSearchBar } from "@/components/semantic-search/SemanticSearchBar";
import {
  SemanticSearchResults,
  SemanticSearchResultItem,
} from "@/components/semantic-search/SemanticSearchResults";
import { AIChat } from "@/components/ai/AIChat";
import {
  ArchitectureOverview,
  ArchitectureSummary,
} from "@/components/architecture/ArchitectureOverview";
import { ArchitectureRiskScore } from "@/components/architecture/ArchitectureRiskScore";
import {
  ArchitectureFindings,
  FindingItem,
} from "@/components/architecture/ArchitectureFindings";
import {
  ArchitectureComponents,
  ComponentItem,
} from "@/components/architecture/ArchitectureComponents";
import { ArchitecturePatterns } from "@/components/architecture/ArchitecturePatterns";
import { ArchitectureAnalysisButton } from "@/components/architecture/ArchitectureAnalysisButton";
import {
  ArchitectureHistory,
  AnalysisHistoryItem,
} from "@/components/architecture/ArchitectureHistory";
import { ArchitectureFindingDetail } from "@/components/architecture/ArchitectureFindingDetail";
import { SystemDesignStudio } from "@/components/system-design/SystemDesignStudio";
import { SystemDesignGenerateButton } from "@/components/system-design/SystemDesignGenerateButton";
import {
  GovernanceOverview,
  GovernanceSummaryData,
} from "@/components/governance/GovernanceOverview";
import {
  GovernanceViolationTable,
  GovernanceViolationItem,
} from "@/components/governance/GovernanceViolationTable";
import {
  GovernanceRules,
  GovernanceRuleItem,
} from "@/components/governance/GovernanceRules";
import { ArchitectureDiffViewer } from "@/components/governance/ArchitectureDiffViewer";
import {
  ArchitectureSnapshotList,
  SnapshotItemData,
} from "@/components/governance/ArchitectureSnapshotList";
import { GovernanceReviewButton } from "@/components/governance/GovernanceReviewButton";
import { GovernanceFindingDetail } from "@/components/governance/GovernanceFindingDetail";

interface RepositoryDetail {
  id: string;
  githubRepositoryId: string;
  name: string;
  fullName: string;
  owner: string;
  ownerLogin: string;
  description: string | null;
  defaultBranch: string;
  visibility: string;
  isPrivate: boolean;
  language: string | null;
  stars: number;
  forks: number;
  isArchived: boolean;
  htmlUrl: string;
  lastSyncedAt: string | null;
  fileCount: number;
  syncStatus: string | null;
}

interface RepositorySyncHistoryItem {
  id: string;
  status: string;
  trigger: string;
  startedAt: string;
  completedAt: string | null;
  filesDiscovered: number;
  filesProcessed: number;
  errorMessage: string | null;
}

export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const repositoryId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<
    | "governance"
    | "system-design"
    | "architecture"
    | "ai"
    | "search"
    | "graph"
    | "files"
    | "syncs"
  >("governance");

  const [repo, setRepo] = useState<RepositoryDetail | null>(null);
  const [files, setFiles] = useState<RepositoryFileNode[]>([]);
  const [syncs, setSyncs] = useState<RepositorySyncHistoryItem[]>([]);
  const [graphSummary, setGraphSummary] = useState<GraphSummaryData | null>(
    null,
  );
  const [semanticStatus, setSemanticStatus] =
    useState<SemanticIndexStatusData | null>(null);

  // Architecture state
  const [archSummary, setArchSummary] = useState<ArchitectureSummary | null>(
    null,
  );
  const [archFindings, setArchFindings] = useState<FindingItem[]>([]);
  const [archComponents, setArchComponents] = useState<ComponentItem[]>([]);
  const [archHistory, setArchHistory] = useState<AnalysisHistoryItem[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<FindingItem | null>(
    null,
  );

  // Governance state
  const [govSummary, setGovSummary] = useState<GovernanceSummaryData | null>(
    null,
  );
  const [govViolations, setGovViolations] = useState<GovernanceViolationItem[]>(
    [],
  );
  const [govRules, setGovRules] = useState<GovernanceRuleItem[]>([]);
  const [govSnapshots, setGovSnapshots] = useState<SnapshotItemData[]>([]);
  const [selectedViolation, setSelectedViolation] =
    useState<GovernanceViolationItem | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<
    SemanticSearchResultItem[]
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRepositoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        repoRes,
        treeRes,
        syncsRes,
        graphRes,
        searchStatusRes,
        archSummaryRes,
        archFindingsRes,
        archCompRes,
        archHistRes,
        govSummaryRes,
        govViolationsRes,
        govRulesRes,
        govSnapshotsRes,
      ] = await Promise.all([
        api.get(`/repositories/${repositoryId}`),
        api.get(`/repositories/${repositoryId}/tree`),
        api.get(`/repositories/${repositoryId}/syncs`),
        api.get(`/repositories/${repositoryId}/graph`),
        api.get(`/repositories/${repositoryId}/semantic-index`),
        api
          .get(`/repositories/${repositoryId}/architecture`)
          .catch(() => ({ data: null })),
        api
          .get(`/repositories/${repositoryId}/architecture/findings`)
          .catch(() => ({ data: { findings: [] } })),
        api
          .get(`/repositories/${repositoryId}/architecture/components`)
          .catch(() => ({ data: { components: [] } })),
        api
          .get(`/repositories/${repositoryId}/architecture/history`)
          .catch(() => ({ data: [] })),
        api
          .get(`/repositories/${repositoryId}/governance`)
          .catch(() => ({ data: null })),
        api
          .get(`/repositories/${repositoryId}/governance/violations`)
          .catch(() => ({ data: [] })),
        api
          .get(`/repositories/${repositoryId}/governance/rules`)
          .catch(() => ({ data: [] })),
        api
          .get(`/repositories/${repositoryId}/governance/snapshots`)
          .catch(() => ({ data: [] })),
      ]);

      setRepo(repoRes.data.data);
      setFiles(treeRes.data.data.files || []);
      setSyncs(syncsRes.data.data.syncs || []);
      setGraphSummary(graphRes.data.data);
      setSemanticStatus(searchStatusRes.data.data);

      if (archSummaryRes.data?.data) {
        setArchSummary(archSummaryRes.data.data);
      }
      if (archFindingsRes.data?.data?.findings) {
        setArchFindings(archFindingsRes.data.data.findings);
      }
      if (archCompRes.data?.data?.components) {
        setArchComponents(archCompRes.data.data.components);
      }
      if (Array.isArray(archHistRes.data?.data)) {
        setArchHistory(archHistRes.data.data);
      }

      if (govSummaryRes.data?.data) {
        setGovSummary(govSummaryRes.data.data);
      }
      if (Array.isArray(govViolationsRes.data?.data)) {
        setGovViolations(govViolationsRes.data.data);
      }
      if (Array.isArray(govRulesRes.data?.data)) {
        setGovRules(govRulesRes.data.data);
      }
      if (Array.isArray(govSnapshotsRes.data?.data)) {
        setGovSnapshots(govSnapshotsRes.data.data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load repository data.",
      );
    } finally {
      setLoading(false);
    }
  }, [repositoryId]);

  useEffect(() => {
    loadRepositoryData();
  }, [loadRepositoryData]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      setSearchLoading(true);
      setSearchQuery(query);
      const res = await api.get(
        `/repositories/${repositoryId}/search?q=${encodeURIComponent(query)}&limit=15`,
      );
      setSearchResults(res.data.data.results || []);
    } catch (err: any) {
      console.error("Semantic search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUpdateViolationStatus = async (
    violationId: string,
    status: string,
  ) => {
    try {
      await api.patch(
        `/repositories/${repositoryId}/governance/violations/${violationId}`,
        { status },
      );
      loadRepositoryData();
    } catch (err) {
      console.error("Failed to update violation status", err);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await api.patch(
        `/repositories/${repositoryId}/governance/rules/${ruleId}`,
        { enabled },
      );
      loadRepositoryData();
    } catch (err) {
      console.error("Failed to toggle rule", err);
    }
  };

  if (loading && !repo) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
          <span>Loading repository details...</span>
        </div>
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="space-y-4">
        <Link
          href="/repositories"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to Repositories
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          {error || "Repository not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Navigation & Actions */}
      <div className="space-y-4">
        <Link
          href="/repositories"
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          ← Back to Repositories
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {repo.fullName}
              </h1>
              {repo.isPrivate ? (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Private
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Public
                </span>
              )}

              <RepositorySyncStatus status={repo.syncStatus} />
            </div>

            {repo.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
                {repo.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              GitHub ↗
            </a>

            <GovernanceReviewButton
              repositoryId={repo.id}
              onReviewCompleted={loadRepositoryData}
            />

            <SystemDesignGenerateButton
              repositoryId={repo.id}
              onGenerateStarted={loadRepositoryData}
            />

            <ArchitectureAnalysisButton
              repositoryId={repo.id}
              onAnalysisStarted={loadRepositoryData}
              isRunning={archSummary?.status === "RUNNING"}
            />

            <RepositorySyncButton
              repositoryId={repo.id}
              onSyncComplete={loadRepositoryData}
            />

            <GraphBuildButton
              repositoryId={repo.id}
              onBuildComplete={loadRepositoryData}
            />

            <SemanticIndexButton
              repositoryId={repo.id}
              onIndexingComplete={loadRepositoryData}
            />
          </div>
        </div>
      </div>

      {/* Metadata Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Language
          </span>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {repo.language || "Not specified"}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Default Branch
          </span>
          <p className="mt-1 text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-100">
            {repo.defaultBranch}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            File Count
          </span>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {repo.fileCount} files
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Last Synced
          </span>
          <p className="mt-1 text-xs text-zinc-900 dark:text-zinc-100">
            {repo.lastSyncedAt
              ? new Date(repo.lastSyncedAt).toLocaleString()
              : "Never"}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab("governance")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "governance"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          Governance 🛡️
        </button>

        <button
          onClick={() => setActiveTab("system-design")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "system-design"
              ? "border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          System Design 📐
        </button>

        <button
          onClick={() => setActiveTab("architecture")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "architecture"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          Architecture Audit 🛡️
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "ai"
              ? "border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          AI Assistant ✨
        </button>

        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "search"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          Semantic Search ({semanticStatus?.totalEmbeddings || 0} Vectors)
        </button>

        <button
          onClick={() => setActiveTab("graph")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "graph"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          Knowledge Graph ({graphSummary?.nodes || 0} Nodes)
        </button>

        <button
          onClick={() => setActiveTab("files")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "files"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          File Tree ({files.length})
        </button>

        <button
          onClick={() => setActiveTab("syncs")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "syncs"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          Sync History ({syncs.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "governance" && (
        <div className="space-y-6">
          <GovernanceOverview summary={govSummary} />

          <GovernanceViolationTable
            violations={govViolations}
            onSelectViolation={(v) => setSelectedViolation(v)}
            onUpdateStatus={handleUpdateViolationStatus}
          />

          <ArchitectureDiffViewer diff={govSummary?.latestDiff} />

          <ArchitectureSnapshotList snapshots={govSnapshots} />

          <GovernanceRules rules={govRules} onToggleRule={handleToggleRule} />
        </div>
      )}

      {activeTab === "system-design" && (
        <div className="space-y-6">
          <SystemDesignStudio repositoryId={repo.id} />
        </div>
      )}

      {activeTab === "architecture" && (
        <div className="space-y-6">
          <ArchitectureOverview summary={archSummary} />
          {archSummary && archSummary.status === "SUCCESS" && (
            <>
              <ArchitectureRiskScore
                score={archSummary.riskScore}
                level={archSummary.riskLevel}
                explanation={archSummary.riskExplanation}
              />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Detected Architecture Patterns
                </h3>
                <ArchitecturePatterns
                  patterns={(archSummary as any).patterns || []}
                />
              </div>
              <ArchitectureFindings
                findings={archFindings}
                onSelectFinding={(f) => setSelectedFinding(f)}
              />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Discovered Architectural Components
                </h3>
                <ArchitectureComponents components={archComponents} />
              </div>
            </>
          )}
          <ArchitectureHistory history={archHistory} />
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-6">
          <AIChat repositoryId={repo.id} />
        </div>
      )}

      {activeTab === "search" && (
        <div className="space-y-6">
          <SemanticIndexStatus statusData={semanticStatus} />
          <SemanticSearchBar onSearch={handleSearch} loading={searchLoading} />
          <SemanticSearchResults results={searchResults} query={searchQuery} />
        </div>
      )}

      {activeTab === "graph" && (
        <div className="space-y-6">
          <GraphSummary summary={graphSummary} />

          {selectedNodeId ? (
            <GraphNeighborhoodView
              repositoryId={repo.id}
              selectedNodeId={selectedNodeId}
              onClearSelection={() => setSelectedNodeId(null)}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraphNodeList
                repositoryId={repo.id}
                onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
              />
              <GraphEdgeList repositoryId={repo.id} />
            </div>
          )}
        </div>
      )}

      {activeTab === "files" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Repository File Navigation
          </h2>
          <RepositoryTree files={files} />
        </div>
      )}

      {activeTab === "syncs" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Synchronization History
          </h2>
          {syncs.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No sync history recorded yet.
            </p>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Trigger</th>
                      <th className="px-4 py-3 font-semibold">
                        Files Processed
                      </th>
                      <th className="px-4 py-3 font-semibold">Started At</th>
                      <th className="px-4 py-3 font-semibold">Completed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {syncs.map((sync) => (
                      <tr
                        key={sync.id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                      >
                        <td className="px-4 py-3 font-medium">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              sync.status === "SUCCESS"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : sync.status === "FAILED"
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {sync.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-mono">
                          {sync.trigger}
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                          {sync.filesProcessed} / {sync.filesDiscovered}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                          {new Date(sync.startedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                          {sync.completedAt
                            ? new Date(sync.completedAt).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finding Detail Modals */}
      <ArchitectureFindingDetail
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
      />

      <GovernanceFindingDetail
        violation={selectedViolation}
        onClose={() => setSelectedViolation(null)}
      />
    </div>
  );
}

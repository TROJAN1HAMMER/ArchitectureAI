"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import {
  SystemDesignOverview,
  SystemDesignSummaryData,
} from "./SystemDesignOverview";
import { DiagramTypeSelector } from "./DiagramTypeSelector";
import { DiagramToolbar } from "./DiagramToolbar";
import { DiagramFilters } from "./DiagramFilters";
import { DiagramCanvas } from "./DiagramCanvas";
import { DiagramNodeDetails } from "./DiagramNodeDetails";

interface SystemDesignStudioProps {
  repositoryId: string;
}

export const SystemDesignStudio: React.FC<SystemDesignStudioProps> = ({
  repositoryId,
}) => {
  const [summary, setSummary] = useState<SystemDesignSummaryData | null>(null);
  const [diagrams, setDiagrams] = useState<any[]>([]);
  const [selectedDiagramType, setSelectedDiagramType] =
    useState<string>("SYSTEM_CONTEXT");
  const [activeDiagram, setActiveDiagram] = useState<any | null>(null);
  const [selectedNodeFilter, setSelectedNodeFilter] = useState<string>("ALL");
  const [inspectingNode, setInspectingNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, diagRes] = await Promise.all([
        api.get(`/repositories/${repositoryId}/system-design`),
        api.get(`/repositories/${repositoryId}/system-design/diagrams`),
      ]);

      setSummary(sumRes.data.data);
      const list = diagRes.data.data || [];
      setDiagrams(list);

      const match =
        list.find((d: any) => d.type === selectedDiagramType) || list[0];
      setActiveDiagram(match || null);
    } catch (err: any) {
      console.error("Failed to load system design studio data:", err);
    } finally {
      setLoading(false);
    }
  }, [repositoryId, selectedDiagramType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectDiagramType = (type: string) => {
    setSelectedDiagramType(type);
    const match = diagrams.find((d) => d.type === type);
    setActiveDiagram(match || null);
  };

  const handleResetLayout = async () => {
    if (!activeDiagram) return;
    try {
      await api.post(
        `/repositories/${repositoryId}/system-design/diagrams/${activeDiagram.id}/reset-layout`,
      );
      loadData();
    } catch (err) {
      console.error("Reset layout failed", err);
    }
  };

  const availableNodeTypes = activeDiagram?.nodes
    ? Array.from(new Set<string>(activeDiagram.nodes.map((n: any) => n.type)))
    : [];

  return (
    <div className="space-y-6">
      <SystemDesignOverview summary={summary} />

      {summary && summary.status !== "NOT_GENERATED" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <DiagramTypeSelector
              selectedType={selectedDiagramType}
              onSelectType={handleSelectDiagramType}
            />
            <DiagramFilters
              selectedNodeType={selectedNodeFilter}
              onSelectNodeType={setSelectedNodeFilter}
              availableNodeTypes={availableNodeTypes}
            />
          </div>

          <div className="border border-gray-800 rounded-xl overflow-hidden shadow-2xl bg-gray-950 relative">
            <DiagramToolbar
              diagram={activeDiagram}
              onResetLayout={handleResetLayout}
            />
            {loading ? (
              <div className="h-[520px] flex items-center justify-center text-xs text-gray-500 animate-pulse">
                Loading C4 Diagram Canvas...
              </div>
            ) : (
              <DiagramCanvas
                diagram={activeDiagram}
                selectedNodeType={selectedNodeFilter}
                onSelectNode={(n) => setInspectingNode(n)}
                onUpdateNodePos={() => {}}
              />
            )}
          </div>
        </div>
      )}

      <DiagramNodeDetails
        node={inspectingNode}
        onClose={() => setInspectingNode(null)}
      />
    </div>
  );
};

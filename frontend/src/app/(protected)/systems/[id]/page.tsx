"use client";

import React, { use, useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { EnterpriseSystemOverview } from "@/components/topology/EnterpriseSystemOverview";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const systemId = resolvedParams.id;

  const [system, setSystem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSystem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/systems/${systemId}`);
      setSystem(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load system details");
    } finally {
      setLoading(false);
    }
  }, [systemId]);

  useEffect(() => {
    loadSystem();
  }, [loadSystem]);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      await api.post(`/systems/${systemId}/topology/analyze`);
      await loadSystem();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to run topology analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-xs text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/repositories"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Repositories
      </Link>

      <EnterpriseSystemOverview
        systemData={system}
        onRunAnalysis={handleRunAnalysis}
        analyzing={analyzing}
      />
    </div>
  );
}

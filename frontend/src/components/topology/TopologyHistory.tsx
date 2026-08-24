import { CheckCircle2, XCircle } from "lucide-react";

export interface AnalysisHistoryItem {
  id: string;
  status: string;
  repositoriesAnalyzed: number;
  dependenciesAnalyzed: number;
  findingsGenerated: number;
  riskScore: number;
  riskLevel: string;
  completedAt: string | null;
  errorMessage?: string | null;
}

export function TopologyHistory({
  history,
}: {
  history: AnalysisHistoryItem[];
}) {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No past topology analysis runs.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {history.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            {item.status === "SUCCESS" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-500" />
            )}
            <div>
              <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                <span>Analysis run</span>
                <span className="text-zinc-400">•</span>
                <span>{item.repositoriesAnalyzed} repos</span>
                <span className="text-zinc-400">•</span>
                <span>{item.dependenciesAnalyzed} deps</span>
                <span className="text-zinc-400">•</span>
                <span>{item.findingsGenerated} findings</span>
              </div>
              <span className="text-[10px] text-zinc-400">
                {item.completedAt
                  ? new Date(item.completedAt).toLocaleString()
                  : "In progress"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              Risk: {item.riskScore} ({item.riskLevel})
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

import { AlertCircle, AlertTriangle } from "lucide-react";

export interface EnterpriseFinding {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  confidence: number;
  sourceRepository?: { name: string };
  targetRepository?: { name: string };
  evidence?: Record<string, any>;
}

export function TopologyFindings({
  findings,
  onSelectFinding,
}: {
  findings: EnterpriseFinding[];
  onSelectFinding?: (finding: EnterpriseFinding) => void;
}) {
  if (!findings || findings.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        No enterprise topology findings detected. System architecture is cleanly
        decoupled.
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
      case "HIGH":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-3">
      {findings.map((f) => (
        <div
          key={f.id}
          onClick={() => onSelectFinding?.(f)}
          className="flex cursor-pointer items-start justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-indigo-500/40 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {f.severity === "CRITICAL" || f.severity === "HIGH" ? (
                <AlertCircle className="h-5 w-5 text-rose-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {f.title}
                </h4>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getSeverityBadge(
                    f.severity,
                  )}`}
                >
                  {f.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {f.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

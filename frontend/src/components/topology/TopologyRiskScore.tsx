import { AlertTriangle, ShieldCheck } from "lucide-react";

export function TopologyRiskScore({
  riskScore,
  riskLevel,
  factorBreakdown,
}: {
  riskScore: number;
  riskLevel: string;
  factorBreakdown?: Record<string, any>;
}) {
  let badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
    badgeColor = "bg-rose-500/10 text-rose-500 border-rose-500/20";
  } else if (riskLevel === "ELEVATED" || riskLevel === "MODERATE") {
    badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Enterprise System Risk
          </h3>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {riskScore}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              / 100
            </span>
            <span
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${badgeColor}`}
            >
              {riskLevel}
            </span>
          </div>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {riskScore > 50 ? (
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          ) : (
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
          )}
        </div>
      </div>

      {factorBreakdown && (
        <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
          <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Risk Factor Penalties
          </h4>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/40">
              <span className="text-zinc-600 dark:text-zinc-400">
                Circular Cycles
              </span>
              <span className="font-semibold text-rose-500">
                +{factorBreakdown.circularDependenciesPenalty || 0} pts
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/40">
              <span className="text-zinc-600 dark:text-zinc-400">
                Service Coupling
              </span>
              <span className="font-semibold text-amber-500">
                +{factorBreakdown.couplingPenalty || 0} pts
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/40">
              <span className="text-zinc-600 dark:text-zinc-400">
                SPOF Concentration
              </span>
              <span className="font-semibold text-rose-500">
                +{factorBreakdown.singlePointOfFailurePenalty || 0} pts
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/40">
              <span className="text-zinc-600 dark:text-zinc-400">
                Cross-Boundary
              </span>
              <span className="font-semibold text-amber-500">
                +{factorBreakdown.crossBoundaryPenalty || 0} pts
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

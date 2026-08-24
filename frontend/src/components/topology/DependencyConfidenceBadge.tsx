import React from "react";

export function DependencyConfidenceBadge({
  confidence,
}: {
  confidence: string;
}) {
  const c = confidence.toUpperCase();
  let bg = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (c === "MEDIUM") {
    bg = "bg-amber-500/10 text-amber-500 border-amber-500/20";
  } else if (c === "LOW") {
    bg = "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${bg}`}
    >
      {confidence}
    </span>
  );
}

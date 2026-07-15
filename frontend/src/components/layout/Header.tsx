import React from "react";

export default function Header() {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-bold text-lg text-primary">ArchitectAI</span>
        <span className="bg-zinc-100 text-zinc-800 text-xs px-2 py-0.5 rounded-full font-medium">
          v1.0.0
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-sm text-zinc-700">
          U
        </div>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import { APP_VERSION } from "@architect-ai/shared";
import { useAuth } from "@/providers/auth-provider";

export default function Header() {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name[0].toUpperCase()
    : user?.email
      ? user.email[0].toUpperCase()
      : "U";

  return (
    <header className="h-16 border-b border-zinc-200 bg-white px-6 flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <span className="font-bold text-lg text-zinc-900">ArchitectAI</span>
        <span className="bg-zinc-100 text-zinc-800 text-xs px-2 py-0.5 rounded-full font-medium">
          v{APP_VERSION}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-600">
          {user?.name || user?.email}
        </span>
        <button
          onClick={logout}
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          Sign Out
        </button>
        <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center font-bold text-sm text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}

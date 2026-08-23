"use client";

import React from "react";
import { APP_VERSION } from "@architect-ai/shared";
import { useAuth } from "@/providers/auth-provider";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name[0].toUpperCase()
    : user?.email
      ? user.email[0].toUpperCase()
      : "U";

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 flex items-center justify-between w-full transition-colors">
      <div className="flex items-center gap-3">
        <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
          ArchitectAI
        </span>
        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs px-2 py-0.5 rounded-full font-medium">
          v{APP_VERSION}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 mr-2">
          {user?.name || user?.email}
        </span>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

        <button
          onClick={logout}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          Sign Out
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-200 flex items-center justify-center font-bold text-sm text-white dark:text-zinc-900 ml-1">
          {initials}
        </div>
      </div>
    </header>
  );
}

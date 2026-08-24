"use client";

import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { GithubAccountCard } from "@/components/github/GithubAccountCard";
import {
  User,
  Shield,
  Server,
  Database,
  Sparkles,
  CheckCircle2,
  Sliders,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setGithubConnected] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await api.get("/users/me");
        setProfile(res.data?.data || null);
      } catch (err) {
        console.error("Failed to load user profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
          <Sliders className="h-7 w-7 text-indigo-500" />
          Settings & Integrations
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Configure external VCS integrations, identity preferences, and view
          platform operational telemetry.
        </p>
      </div>

      {/* GitHub Integration Card */}
      <div className="space-y-4">
        <GithubAccountCard onAccountChange={setGithubConnected} />
      </div>

      {/* Account Profile Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-indigo-500" />
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Account Profile
          </h2>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ) : profile ? (
          <dl className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Email Address
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {profile.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Account Role
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-500" />
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  {profile.role}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Account ID
              </dt>
              <dd className="mt-1 text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate">
                {profile.id}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">Failed to load user profile.</p>
        )}
      </div>

      {/* Platform Architecture & Engine Status Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-indigo-500" />
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Platform Engine & Subsystems
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3.5 rounded-lg border border-zinc-100 bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <Sparkles className="h-5 w-5 text-indigo-500 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Architecture Intelligence & LLM Provider
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Deterministic RAG context generation & AST knowledge graphs
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Active & Operational
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-lg border border-zinc-100 bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <Database className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Semantic Vector & Graph Store
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                PostgreSQL with Prisma ORM & Redis distributed locking
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

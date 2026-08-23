"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="text-zinc-500 font-medium">Authenticating...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 w-full">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto bg-white rounded-xl border border-zinc-200 p-8 shadow-sm min-h-[calc(100vh-8rem)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

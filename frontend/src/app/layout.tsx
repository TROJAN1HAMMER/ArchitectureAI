import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/providers";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "ArchitectAI - AI-powered Engineering Intelligence",
  description: "AI-powered Engineering Intelligence & System Design Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <div className="flex flex-col min-h-screen bg-zinc-50">
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
        </Providers>
      </body>
    </html>
  );
}

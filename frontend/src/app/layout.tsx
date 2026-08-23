import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/providers";
import { ThemeProvider } from "next-themes";

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const toggle = () => setTheme(currentTheme === "dark" ? "light" : "dark");

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      className="
        relative w-8 h-8 flex items-center justify-center rounded-lg
        text-zinc-500 dark:text-zinc-400
        hover:text-zinc-900 dark:hover:text-zinc-100
        hover:bg-zinc-100 dark:hover:bg-zinc-800
        transition-colors duration-150
      "
    >
      <Sun
        size={16}
        className={`absolute transition-all duration-200 ${
          currentTheme === "dark"
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-50"
        }`}
      />
      <Moon
        size={16}
        className={`absolute transition-all duration-200 ${
          currentTheme === "dark"
            ? "opacity-0 -rotate-90 scale-50"
            : "opacity-100 rotate-0 scale-100"
        }`}
      />
    </button>
  );
}

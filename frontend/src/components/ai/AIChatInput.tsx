"use client";

import React, { useState } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";

interface AIChatInputProps {
  onSendMessage: (message: string) => void;
  loading: boolean;
}

export const AIChatInput: React.FC<AIChatInputProps> = ({
  onSendMessage,
  loading,
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = [
    "How does authentication work?",
    "Show the backend architecture",
    "Where are database models defined?",
    "What components import the repository service?",
  ];

  return (
    <div className="space-y-3">
      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Sparkles className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 flex-shrink-0">
          Quick Prompts:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(prompt)}
            disabled={loading}
            className="flex-shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-700 shadow-sm hover:border-cyan-500 hover:text-cyan-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-cyan-500 dark:hover:text-cyan-400 transition disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this repository..."
          rows={2}
          disabled={loading}
          className="w-full resize-none rounded-xl border border-zinc-300 bg-white p-3.5 pr-12 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-cyan-500 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow hover:bg-cyan-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 transition"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
};

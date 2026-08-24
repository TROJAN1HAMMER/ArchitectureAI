"use client";

import React from "react";
import { Bot, User as UserIcon } from "lucide-react";
import { AISourceList, AISourceItem } from "./AISourceList";

export interface ChatMessageItem {
  id?: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: AISourceItem[];
  createdAt?: string;
}

interface AIMessageProps {
  message: ChatMessageItem;
}

export const AIMessage: React.FC<AIMessageProps> = ({ message }) => {
  const isUser = message.role === "USER";

  return (
    <div
      className={`flex gap-3 p-4 rounded-xl transition ${
        isUser
          ? "bg-zinc-100 dark:bg-zinc-900/80 ml-auto max-w-[85%]"
          : "bg-white border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 mr-auto w-full"
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 text-white ${
          isUser
            ? "bg-zinc-700 dark:bg-zinc-600"
            : "bg-gradient-to-tr from-cyan-600 to-emerald-600"
        }`}
      >
        {isUser ? (
          <UserIcon className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div className="flex-1 space-y-2 text-sm overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
            {isUser ? "You" : "ArchitectAI Assistant"}
          </span>
          {message.createdAt && (
            <span className="text-[10px] text-zinc-400">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
          {message.content}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <AISourceList sources={message.sources} />
        )}
      </div>
    </div>
  );
};

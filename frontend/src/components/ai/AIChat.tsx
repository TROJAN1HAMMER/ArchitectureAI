"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "@/services/api";
import { AIMessage, ChatMessageItem } from "./AIMessage";
import { AIChatInput } from "./AIChatInput";
import { ConversationList, ConversationItem } from "./ConversationList";
import { Bot, AlertCircle } from "lucide-react";

interface AIChatProps {
  repositoryId: string;
}

export const AIChat: React.FC<AIChatProps> = ({ repositoryId }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get(
        `/repositories/${repositoryId}/ai/conversations`,
      );
      setConversations(res.data?.data || []);
    } catch {
      // Non-fatal
    }
  }, [repositoryId]);

  const loadConversationMessages = useCallback(
    async (convId: string) => {
      try {
        setError(null);
        const res = await api.get(
          `/repositories/${repositoryId}/ai/conversations/${convId}`,
        );
        const rawMessages = res.data?.data?.messages || [];

        const formatted: ChatMessageItem[] = rawMessages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.metadata?.sources || [],
          createdAt: m.createdAt,
        }));

        setMessages(formatted);
        setActiveConversationId(convId);
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message || "Failed to load conversation",
        );
      }
    },
    [repositoryId],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (userMessage: string) => {
    try {
      setLoading(true);
      setError(null);

      // Append user message optimistically
      const optimisticUserMsg: ChatMessageItem = {
        role: "USER",
        content: userMessage,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUserMsg]);

      const payload: any = { message: userMessage };
      if (activeConversationId) {
        payload.conversationId = activeConversationId;
      }

      const res = await api.post(
        `/repositories/${repositoryId}/ai/chat`,
        payload,
      );
      const responseData = res.data?.data;

      if (responseData) {
        if (!activeConversationId && responseData.conversationId) {
          setActiveConversationId(responseData.conversationId);
          loadConversations();
        }

        const assistantMsg: ChatMessageItem = {
          id: responseData.message?.id,
          role: "ASSISTANT",
          content: responseData.message?.content || "",
          sources: responseData.sources || [],
          createdAt:
            responseData.message?.createdAt || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(
          "An AI request is currently in progress. Please wait a moment.",
        );
      } else {
        setError(
          err.response?.data?.error?.message ||
            "Failed to get AI response. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await api.delete(
        `/repositories/${repositoryId}/ai/conversations/${convId}`,
      );
      if (activeConversationId === convId) {
        handleNewConversation();
      }
      loadConversations();
    } catch {
      // Non-fatal
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
      {/* Sidebar - Conversation List */}
      <div className="lg:col-span-1">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={loadConversationMessages}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main Chat Panel */}
      <div className="lg:col-span-3 flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 max-h-[420px] pr-2 mb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 dark:text-zinc-600">
              <Bot className="h-10 w-10 mb-3 text-cyan-600 dark:text-cyan-500 opacity-80" />
              <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                ArchitectAI Repository Assistant
              </h3>
              <p className="mt-1 text-xs max-w-sm">
                Ask architectural questions about authentication, files,
                dependencies, or service design grounded in repository evidence.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => <AIMessage key={idx} message={msg} />)
          )}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 p-3 animate-pulse">
              <Bot className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>ArchitectAI is analyzing repository context...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <AIChatInput onSendMessage={handleSendMessage} loading={loading} />
      </div>
    </div>
  );
};

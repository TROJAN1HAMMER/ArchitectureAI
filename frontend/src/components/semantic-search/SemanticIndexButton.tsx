"use client";

import React, { useState } from "react";
import api from "@/services/api";

interface SemanticIndexButtonProps {
  repositoryId: string;
  onIndexingComplete?: () => void;
}

export function SemanticIndexButton({
  repositoryId,
  onIndexingComplete,
}: SemanticIndexButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIndex = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.post(`/repositories/${repositoryId}/semantic-index`);
      if (onIndexingComplete) {
        onIndexingComplete();
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("Semantic indexing is already in progress");
      } else {
        setError(
          err.response?.data?.error?.message || "Failed to trigger indexing",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end">
      <button
        onClick={handleIndex}
        disabled={loading}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        {loading ? (
          <>
            <svg
              className="h-3.5 w-3.5 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Indexing Embeddings...
          </>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Index Embeddings
          </>
        )}
      </button>

      {error && (
        <span className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}

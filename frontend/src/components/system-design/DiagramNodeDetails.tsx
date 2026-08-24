"use client";

import React from "react";
import { X, Cpu, GitCommit, FileCode } from "lucide-react";

interface DiagramNodeDetailsProps {
  node: any | null;
  onClose: () => void;
}

export const DiagramNodeDetails: React.FC<DiagramNodeDetailsProps> = ({
  node,
  onClose,
}) => {
  if (!node) return null;

  const meta = node.metadata || {};

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-gray-950 border-l border-gray-800 p-5 shadow-2xl space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white text-sm truncate">{node.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 text-gray-300">
        <div>
          <span className="text-[10px] text-gray-500 uppercase font-semibold">
            Node Type
          </span>
          <div className="mt-0.5 inline-block px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded">
            {node.type}
          </div>
        </div>

        <div>
          <span className="text-[10px] text-gray-500 uppercase font-semibold">
            Label / Role
          </span>
          <div className="font-semibold text-white mt-0.5">{node.label}</div>
        </div>

        <div>
          <span className="text-[10px] text-gray-500 uppercase font-semibold">
            Description
          </span>
          <p className="text-gray-300 leading-relaxed mt-0.5 bg-gray-900 p-2.5 rounded border border-gray-800">
            {node.description || "No description available."}
          </p>
        </div>

        {meta.path && (
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
              <FileCode className="w-3 h-3 text-gray-400" /> Repository Source
              Path
            </span>
            <div className="font-mono text-[11px] text-indigo-300 mt-0.5 truncate bg-gray-900 p-2 rounded border border-gray-800">
              {meta.path}
            </div>
          </div>
        )}

        {node.graphNodeId && (
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
              <GitCommit className="w-3 h-3 text-gray-400" /> Knowledge Graph
              Reference
            </span>
            <div className="font-mono text-[10px] text-gray-400 mt-0.5 truncate">
              {node.graphNodeId}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

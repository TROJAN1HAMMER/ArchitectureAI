"use client";

import React from "react";
import { X, ShieldAlert, FileCode } from "lucide-react";

interface GovernanceFindingDetailProps {
  violation: any | null;
  onClose: () => void;
}

export const GovernanceFindingDetail: React.FC<
  GovernanceFindingDetailProps
> = ({ violation, onClose }) => {
  if (!violation) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-gray-950 border-l border-gray-800 p-5 shadow-2xl space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h3 className="font-bold text-white text-sm truncate">
            {violation.title}
          </h3>
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
            Severity
          </span>
          <div className="mt-0.5">
            <span className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {violation.severity}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-gray-500 uppercase font-semibold">
            Description
          </span>
          <p className="text-gray-300 leading-relaxed mt-0.5 bg-gray-900 p-2.5 rounded border border-gray-800">
            {violation.description}
          </p>
        </div>

        {violation.rule && (
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold">
              Associated Rule
            </span>
            <div className="font-semibold text-white mt-0.5">
              {violation.rule.name}
            </div>
          </div>
        )}

        {violation.evidence && (
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
              <FileCode className="w-3 h-3 text-gray-400" /> Raw Evidence
              Details
            </span>
            <pre className="font-mono text-[10px] text-gray-300 mt-1 p-2 bg-gray-900 rounded border border-gray-800 overflow-x-auto max-h-40">
              {JSON.stringify(violation.evidence, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

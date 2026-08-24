"use client";

import React from "react";
import { Layers, Box, Cpu } from "lucide-react";

interface DiagramTypeSelectorProps {
  selectedType: string;
  onSelectType: (type: string) => void;
}

export const DiagramTypeSelector: React.FC<DiagramTypeSelectorProps> = ({
  selectedType,
  onSelectType,
}) => {
  const tabs = [
    { type: "SYSTEM_CONTEXT", label: "C4 System Context", icon: Layers },
    { type: "CONTAINER", label: "C4 Containers", icon: Box },
    { type: "COMPONENT", label: "C4 Components", icon: Cpu },
  ];

  return (
    <div className="flex border-b border-gray-800 space-x-1">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = selectedType === t.type;
        return (
          <button
            key={t.type}
            onClick={() => onSelectType(t.type)}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              active
                ? "border-cyan-500 text-cyan-400 font-bold bg-cyan-500/10"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

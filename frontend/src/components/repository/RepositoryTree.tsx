"use client";

import React, { useState } from "react";

export interface RepositoryFileNode {
  id: string;
  path: string;
  name: string;
  extension?: string | null;
  size: number;
  sha: string;
  type: "blob" | "tree" | string;
  parentPath?: string | null;
}

interface RepositoryTreeProps {
  files: RepositoryFileNode[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface TreeNode {
  name: string;
  path: string;
  type: "blob" | "tree";
  size: number;
  extension?: string | null;
  children?: TreeNode[];
}

function buildTree(files: RepositoryFileNode[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  // Sort files so directories come first, then alphabetically
  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "tree" ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });

  for (const file of sorted) {
    const node: TreeNode = {
      name: file.name,
      path: file.path,
      type: file.type === "tree" ? "tree" : "blob",
      size: file.size,
      extension: file.extension,
      children: file.type === "tree" ? [] : undefined,
    };

    map.set(file.path, node);

    if (!file.parentPath) {
      root.push(node);
    } else {
      const parentNode = map.get(file.parentPath);
      if (parentNode && parentNode.children) {
        parentNode.children.push(node);
      } else {
        // Fallback if parent directory node missing
        root.push(node);
      }
    }
  }

  return root;
}

function TreeItem({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [isOpen, setIsOpen] = useState(level < 1);
  const isDirectory = node.type === "tree";

  return (
    <div className="select-none">
      <div
        onClick={() => isDirectory && setIsOpen(!isOpen)}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        className={`flex items-center justify-between py-1.5 px-2 rounded-md text-sm transition-colors ${
          isDirectory
            ? "cursor-pointer font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {isDirectory ? (
            <svg
              className={`h-4 w-4 shrink-0 text-amber-500 transition-transform ${
                isOpen ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500 ml-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          )}

          <span className="truncate font-mono text-xs sm:text-sm">
            {node.name}
          </span>
        </div>

        {!isDirectory && node.size > 0 && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono ml-4 shrink-0">
            {formatBytes(node.size)}
          </span>
        )}
      </div>

      {isDirectory && isOpen && node.children && (
        <div className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <TreeItem key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RepositoryTree({ files }: RepositoryTreeProps) {
  if (!files || files.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No files discovered yet. Click &quot;Sync Repository&quot; to ingest
          the repository file tree.
        </p>
      </div>
    );
  }

  const tree = buildTree(files);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 font-mono">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-100 dark:border-zinc-800 text-xs font-sans font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        <span>Structure ({files.length} items)</span>
        <span>Size</span>
      </div>

      <div className="space-y-0.5 max-h-[600px] overflow-y-auto pr-1">
        {tree.map((node) => (
          <TreeItem key={node.path} node={node} />
        ))}
      </div>
    </div>
  );
}

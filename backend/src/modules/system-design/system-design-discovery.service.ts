import { Injectable } from "@nestjs/common";
import { GraphNode, GraphEdge } from "@prisma/client";

export interface DiscoveredSystemElement {
  name: string;
  type: string; // PERSON, SYSTEM, CONTAINER, COMPONENT, DATABASE, EXTERNAL_SYSTEM, API, SERVICE
  label: string;
  description: string;
  graphNodeId?: string;
  path?: string;
  parentName?: string;
  metadata?: any;
}

export interface DiscoveredSystemRelationship {
  sourceName: string;
  targetName: string;
  type: string; // USES, CALLS, DEPENDS_ON, CONTAINS, READS, WRITES, EXPOSES, IMPORTS
  label: string;
}

@Injectable()
export class SystemDesignDiscoveryService {
  discoverSystemElements(
    nodes: GraphNode[],
    _edges: GraphEdge[],
  ): {
    elements: DiscoveredSystemElement[];
    relationships: DiscoveredSystemRelationship[];
  } {
    const elements: DiscoveredSystemElement[] = [];
    const relationships: DiscoveredSystemRelationship[] = [];

    // 1. Core C4 System Context Elements
    elements.push({
      name: "User / Engineer",
      type: "PERSON",
      label: "Software Engineer",
      description:
        "Interacts with ArchitectAI to view architecture insights and query codebases.",
    });

    elements.push({
      name: "ArchitectAI System",
      type: "SYSTEM",
      label: "ArchitectAI Platform",
      description:
        "AI-powered Engineering Intelligence & System Design Platform.",
    });

    elements.push({
      name: "GitHub REST API",
      type: "EXTERNAL_SYSTEM",
      label: "GitHub API",
      description: "External Git version control & OAuth provider.",
    });

    relationships.push({
      sourceName: "User / Engineer",
      targetName: "ArchitectAI System",
      type: "USES",
      label: "Interacts via Web UI",
    });

    relationships.push({
      sourceName: "ArchitectAI System",
      targetName: "GitHub REST API",
      type: "CALLS",
      label: "Fetches repository trees & tokens",
    });

    // 2. C4 Containers (Frontend, Backend API, PostgreSQL, Redis)
    const frontendNode = nodes.find((n) =>
      (n.path || "").toLowerCase().startsWith("frontend/"),
    );
    const backendNode = nodes.find((n) =>
      (n.path || "").toLowerCase().startsWith("backend/"),
    );
    const dbNode = nodes.find(
      (n) =>
        (n.path || "").toLowerCase().includes("prisma") ||
        (n.path || "").toLowerCase().includes("schema.prisma"),
    );

    elements.push({
      name: "Frontend Web Application",
      type: "CONTAINER",
      label: "Next.js 15 App Router",
      description:
        "Provides React 19 UI, dark/light themes, and interactive design canvas.",
      graphNodeId: frontendNode?.id,
      path: "frontend/",
      parentName: "ArchitectAI System",
    });

    elements.push({
      name: "Backend API Service",
      type: "CONTAINER",
      label: "NestJS v10 API",
      description:
        "Handles authentication, repository intelligence, knowledge graph, search, RAG, and audit services.",
      graphNodeId: backendNode?.id,
      path: "backend/src/",
      parentName: "ArchitectAI System",
    });

    elements.push({
      name: "PostgreSQL Database",
      type: "DATABASE",
      label: "PostgreSQL + pgvector",
      description:
        "Stores relational records, knowledge graph nodes/edges, vector embeddings, and architecture findings.",
      graphNodeId: dbNode?.id,
      path: "backend/prisma/schema.prisma",
      parentName: "ArchitectAI System",
    });

    elements.push({
      name: "Redis Infrastructure",
      type: "DATABASE",
      label: "Redis Cache & Lock",
      description:
        "Manages distributed EX 60/600 NX concurrency locks for sync, graph, search, AI, and architecture background jobs.",
      parentName: "ArchitectAI System",
    });

    relationships.push({
      sourceName: "Frontend Web Application",
      targetName: "Backend API Service",
      type: "USES",
      label: "REST API HTTP Calls (Axios)",
    });

    relationships.push({
      sourceName: "Backend API Service",
      targetName: "PostgreSQL Database",
      type: "READS",
      label: "Prisma ORM SQL Queries",
    });

    relationships.push({
      sourceName: "Backend API Service",
      targetName: "Redis Infrastructure",
      type: "DEPENDS_ON",
      label: "Concurrency locks & session cache",
    });

    // 3. C4 Components (Map from GraphNodes across repository structures)
    const componentNodeMap = new Map<
      string,
      {
        label: string;
        desc: string;
        type: string;
        nodeIds: Set<string>;
        paths: Set<string>;
      }
    >();

    // Helper to categorize node path into architectural components
    for (const node of nodes) {
      if (node.type === "REPOSITORY") continue;
      const path = node.path || node.name || "";
      const lower = path.toLowerCase();

      // Skip non-code meta paths
      if (
        lower.includes(".git/") ||
        lower.includes("node_modules/") ||
        lower.includes("__pycache__") ||
        lower.endsWith(".lock") ||
        lower.endsWith(".png") ||
        lower.endsWith(".jpg")
      ) {
        continue;
      }

      let key = "";
      let label = "";
      let desc = "";
      let compType = "COMPONENT";

      if (lower.includes("/auth") || lower.startsWith("auth")) {
        key = "auth";
        label = "Authentication & Identity Module";
        desc =
          "Manages user authentication, token signing, and security guards.";
        compType = "SERVICE";
      } else if (
        lower.includes("/repository") ||
        lower.startsWith("repository")
      ) {
        key = "repository";
        label = "Repository Sync Engine";
        desc =
          "Ingests VCS trees, branch metadata, and repository file structures.";
        compType = "SERVICE";
      } else if (
        lower.includes("/knowledge-graph") ||
        lower.includes("/graph")
      ) {
        key = "knowledge-graph";
        label = "Knowledge Graph Engine";
        desc =
          "Constructs hierarchical AST entity nodes and semantic relationships.";
        compType = "SERVICE";
      } else if (
        lower.includes("/semantic-search") ||
        lower.includes("/embedding") ||
        lower.includes("/vector")
      ) {
        key = "semantic-search";
        label = "Semantic Vector Search";
        desc =
          "Generates text chunk embeddings and provides vector similarity search.";
        compType = "SERVICE";
      } else if (
        lower.includes("/ai") ||
        lower.includes("/rag") ||
        lower.includes("/llm")
      ) {
        key = "ai";
        label = "AI & RAG Intelligence Engine";
        desc =
          "Retrieves grounded codebase context and drives LLM conversational reasoning.";
        compType = "SERVICE";
      } else if (
        lower.includes("/architecture") ||
        lower.includes("/audit") ||
        lower.includes("/scanner")
      ) {
        key = "architecture";
        label = "Architecture Audit Engine";
        desc =
          "Analyzes structural coupling, circular dependencies, and architectural drift.";
        compType = "SERVICE";
      } else if (
        lower.includes("/governance") ||
        lower.includes("/policy") ||
        lower.includes("/rule")
      ) {
        key = "governance";
        label = "Governance & Compliance Engine";
        desc =
          "Evaluates architecture snapshots and enforces organizational policies.";
        compType = "SERVICE";
      } else if (
        lower.includes("/remediation") ||
        lower.includes("/refactor") ||
        lower.includes("/fix")
      ) {
        key = "remediation";
        label = "Autonomous Remediation Engine";
        desc = "Generates safe code refactoring patches and validation plans.";
        compType = "SERVICE";
      } else if (
        lower.includes("/api") ||
        lower.includes("/controller") ||
        lower.includes("/routes") ||
        lower.includes("/endpoints")
      ) {
        key = "api";
        label = "API & Gateway Controllers";
        desc =
          "Exposes REST endpoints, handles request validation, and routes traffic.";
        compType = "API";
      } else if (
        lower.includes("/data") ||
        lower.includes("/db") ||
        lower.includes("/model") ||
        lower.includes("/loader")
      ) {
        key = "data";
        label = "Data Access & Model Layer";
        desc =
          "Handles database operations, schema definitions, and model persistence.";
        compType = "DATABASE";
      } else if (
        lower.startsWith("frontend/") ||
        lower.startsWith("src/components/")
      ) {
        key = "ui";
        label = "UI Component Studio";
        desc = "Interactive React interface and client-side design canvas.";
        compType = "COMPONENT";
      } else {
        // Dynamic directory grouping for arbitrary projects (e.g. Python src/data, Go pkg/engine)
        const parts = path.split("/").filter(Boolean);
        if (parts.length >= 2) {
          const dirKey =
            parts[0] === "src" && parts.length >= 2 ? parts[1] : parts[0];
          key = dirKey.toLowerCase();
          const cleanName = dirKey.replace(/[-_]/g, " ");
          label =
            cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + " Module";
          desc = `Domain component for ${cleanName}.`;
        }
      }

      if (key) {
        if (!componentNodeMap.has(key)) {
          componentNodeMap.set(key, {
            label,
            desc,
            type: compType,
            nodeIds: new Set(),
            paths: new Set(),
          });
        }
        const entry = componentNodeMap.get(key)!;
        entry.nodeIds.add(node.id);
        if (node.path) entry.paths.add(node.path);
      }
    }

    // If still empty, infer primary components from top-level repository directories
    if (componentNodeMap.size === 0) {
      const topDirs = new Set<string>();
      for (const node of nodes) {
        if (node.path && node.path.includes("/")) {
          topDirs.add(node.path.split("/")[0]);
        }
      }
      for (const dir of topDirs) {
        const clean = dir.replace(/[-_]/g, " ");
        const label =
          clean.charAt(0).toUpperCase() + clean.slice(1) + " Component";
        componentNodeMap.set(dir.toLowerCase(), {
          label,
          desc: `Application component responsible for ${clean} domain logic.`,
          type: "COMPONENT",
          nodeIds: new Set(),
          paths: new Set(),
        });
      }
    }

    const componentNames: string[] = [];

    for (const [, config] of componentNodeMap.entries()) {
      const name = config.label;
      componentNames.push(name);

      elements.push({
        name,
        type: config.type,
        label: config.label,
        description: config.desc,
        parentName: "Backend API Service",
      });

      relationships.push({
        sourceName: "Backend API Service",
        targetName: name,
        type: "CONTAINS",
        label: "Encapsulates",
      });
    }

    // Create cross-component dependency relationships from Knowledge Graph edges
    const nodeIdToCompName = new Map<string, string>();
    for (const [, config] of componentNodeMap.entries()) {
      for (const nodeId of config.nodeIds) {
        nodeIdToCompName.set(nodeId, config.label);
      }
    }

    const connectedPairs = new Set<string>();
    for (const edge of _edges) {
      const srcComp = nodeIdToCompName.get(edge.sourceNodeId);
      const tgtComp = nodeIdToCompName.get(edge.targetNodeId);
      if (srcComp && tgtComp && srcComp !== tgtComp) {
        const pairKey = `${srcComp}->${tgtComp}`;
        if (!connectedPairs.has(pairKey)) {
          connectedPairs.add(pairKey);
          relationships.push({
            sourceName: srcComp,
            targetName: tgtComp,
            type: "DEPENDS_ON",
            label: edge.type || "Interacts with",
          });
        }
      }
    }

    // Fallback: If no direct cross-component edges exist, establish logical domain pipelines
    if (connectedPairs.size === 0 && componentNames.length > 1) {
      for (let i = 0; i < componentNames.length - 1; i++) {
        relationships.push({
          sourceName: componentNames[i],
          targetName: componentNames[i + 1],
          type: "USES",
          label: "Communicates with",
        });
      }
    }

    return { elements, relationships };
  }
}

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

    // 3. C4 Components (Map from GraphNodes in backend)
    const componentNodeMap = new Map<string, GraphNode>();
    for (const node of nodes) {
      if (node.path && node.path.startsWith("backend/src/modules/")) {
        const parts = node.path.split("/");
        if (parts.length >= 4) {
          const moduleName = parts[3]; // e.g. auth, repository, knowledge-graph, ai, architecture
          if (!componentNodeMap.has(moduleName)) {
            componentNodeMap.set(moduleName, node);
          }
        }
      }
    }

    const moduleLabelMap: Record<
      string,
      { label: string; desc: string; type: string }
    > = {
      auth: {
        label: "Auth Module",
        desc: "Manages JWT & Argon2id authentication.",
        type: "SERVICE",
      },
      repository: {
        label: "Repository Sync Engine",
        desc: "Ingests Git repository file trees.",
        type: "SERVICE",
      },
      "knowledge-graph": {
        label: "Knowledge Graph Builder",
        desc: "Builds structural node & edge relationships.",
        type: "SERVICE",
      },
      "semantic-search": {
        label: "Semantic Vector Search",
        desc: "Generates pgvector embeddings & similarity search.",
        type: "SERVICE",
      },
      ai: {
        label: "Grounded RAG Assistant",
        desc: "Executes bounded context RAG pipelines.",
        type: "SERVICE",
      },
      architecture: {
        label: "Architecture Audit Engine",
        desc: "Detects cycles, coupling, and boundary violations.",
        type: "SERVICE",
      },
    };

    for (const [modKey, node] of componentNodeMap.entries()) {
      const config = moduleLabelMap[modKey] || {
        label: `${modKey.toUpperCase()} Module`,
        desc: `Domain component for ${modKey}.`,
        type: "COMPONENT",
      };

      const name = `${config.label}`;
      elements.push({
        name,
        type: config.type,
        label: config.label,
        description: config.desc,
        graphNodeId: node.id,
        path: node.path!,
        parentName: "Backend API Service",
      });

      relationships.push({
        sourceName: "Backend API Service",
        targetName: name,
        type: "CONTAINS",
        label: "Encapsulates",
      });
    }

    return { elements, relationships };
  }
}

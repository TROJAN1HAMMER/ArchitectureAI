import { Injectable } from "@nestjs/common";
import { GraphNode, GraphEdge } from "@prisma/client";

export interface ArchitecturalComponent {
  name: string;
  type: string;
  confidence: number;
  supportingNodeIds: string[];
  supportingPaths: string[];
  metrics: {
    nodeCount: number;
    fileCount: number;
    inboundDependencies: number;
    outboundDependencies: number;
  };
}

@Injectable()
export class ArchitectureDiscoveryService {
  discoverComponents(
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): ArchitecturalComponent[] {
    if (!nodes || nodes.length === 0) {
      return [];
    }

    const componentMap = new Map<
      string,
      {
        type: string;
        nodeIds: Set<string>;
        paths: Set<string>;
      }
    >();

    // Helper to bucket paths into logical component names
    for (const node of nodes) {
      const path = node.path || node.qualifiedName;
      const lowerPath = path.toLowerCase();

      let compName = "Root Domain";
      let compType = "module";

      if (
        lowerPath.startsWith("frontend/") ||
        lowerPath.startsWith("src/components/")
      ) {
        compName = "Frontend Application UI";
        compType = "frontend";
      } else if (
        lowerPath.startsWith("backend/src/modules/auth") ||
        lowerPath.includes("/auth/")
      ) {
        compName = "Authentication & Security Module";
        compType = "service";
      } else if (
        lowerPath.startsWith("backend/src/modules/repository") ||
        lowerPath.includes("/repository/")
      ) {
        compName = "Repository Intelligence Module";
        compType = "service";
      } else if (
        lowerPath.startsWith("backend/src/modules/knowledge-graph") ||
        lowerPath.includes("/knowledge-graph/")
      ) {
        compName = "Knowledge Graph Engine";
        compType = "service";
      } else if (
        lowerPath.startsWith("backend/src/modules/semantic-search") ||
        lowerPath.includes("/semantic-search/")
      ) {
        compName = "Semantic Search Subsystem";
        compType = "service";
      } else if (
        lowerPath.startsWith("backend/src/modules/ai") ||
        lowerPath.includes("/ai/")
      ) {
        compName = "AI & RAG Foundation";
        compType = "service";
      } else if (
        lowerPath.includes("controller") ||
        lowerPath.includes("/api/")
      ) {
        compName = "API Gateway & Controllers";
        compType = "api";
      } else if (
        lowerPath.includes("prisma") ||
        lowerPath.includes("schema") ||
        lowerPath.includes("database")
      ) {
        compName = "Database & Data Layer";
        compType = "database";
      } else if (
        lowerPath.startsWith("packages/shared") ||
        lowerPath.includes("common")
      ) {
        compName = "Shared Domain & Utilities";
        compType = "shared";
      } else if (lowerPath.includes("spec.") || lowerPath.includes("test")) {
        compName = "Test Suite Foundation";
        compType = "tests";
      } else {
        // Fallback: directory level grouping
        const parts = path.split("/").filter(Boolean);
        if (parts.length >= 2) {
          compName = `${parts[0]}/${parts[1]}`;
        }
      }

      if (!componentMap.has(compName)) {
        componentMap.set(compName, {
          type: compType,
          nodeIds: new Set(),
          paths: new Set(),
        });
      }

      const comp = componentMap.get(compName)!;
      comp.nodeIds.add(node.id);
      if (node.path) {
        comp.paths.add(node.path);
      }
    }

    // Build degree maps from edges
    const inboundDegree = new Map<string, number>();
    const outboundDegree = new Map<string, number>();

    for (const edge of edges) {
      outboundDegree.set(
        edge.sourceNodeId,
        (outboundDegree.get(edge.sourceNodeId) || 0) + 1,
      );
      inboundDegree.set(
        edge.targetNodeId,
        (inboundDegree.get(edge.targetNodeId) || 0) + 1,
      );
    }

    const components: ArchitecturalComponent[] = [];

    for (const [name, comp] of componentMap.entries()) {
      let totalInbound = 0;
      let totalOutbound = 0;

      for (const nodeId of comp.nodeIds) {
        totalInbound += inboundDegree.get(nodeId) || 0;
        totalOutbound += outboundDegree.get(nodeId) || 0;
      }

      const nodeCount = comp.nodeIds.size;
      const fileCount = comp.paths.size || nodeCount;
      const confidence = Math.min(0.98, Math.max(0.65, 0.7 + nodeCount * 0.02));

      components.push({
        name,
        type: comp.type,
        confidence: parseFloat(confidence.toFixed(2)),
        supportingNodeIds: Array.from(comp.nodeIds),
        supportingPaths: Array.from(comp.paths),
        metrics: {
          nodeCount,
          fileCount,
          inboundDependencies: totalInbound,
          outboundDependencies: totalOutbound,
        },
      });
    }

    components.sort((a, b) => b.metrics.nodeCount - a.metrics.nodeCount);
    return components;
  }
}

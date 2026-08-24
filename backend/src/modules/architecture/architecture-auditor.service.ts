import { Injectable } from "@nestjs/common";
import {
  GraphNode,
  GraphEdge,
  ArchitectureFindingSeverity,
  ArchitectureFindingType,
} from "@prisma/client";

export interface DraftFinding {
  type: ArchitectureFindingType;
  severity: ArchitectureFindingSeverity;
  title: string;
  description: string;
  confidence: number;
  sourceNodeId?: string | null;
  targetNodeId?: string | null;
  evidence?: any;
  metadata?: any;
}

@Injectable()
export class ArchitectureAuditorService {
  auditArchitecture(nodes: GraphNode[], edges: GraphEdge[]): DraftFinding[] {
    if (!nodes || nodes.length === 0) {
      return [];
    }

    const findings: DraftFinding[] = [];
    const nodeMap = new Map<string, GraphNode>(nodes.map((n) => [n.id, n]));

    // 1. Circular Dependency Detection using DFS Cycle Detection
    const circularFindings = this.detectCircularDependencies(
      nodes,
      edges,
      nodeMap,
    );
    findings.push(...circularFindings);

    // 2. High Coupling & Hotspots Analysis
    const couplingFindings = this.detectCouplingAndHotspots(nodes, edges);
    findings.push(...couplingFindings);

    // 3. Orphan Component Detection
    const orphanFindings = this.detectOrphanComponents(nodes, edges);
    findings.push(...orphanFindings);

    // 4. Large Component Detection
    const largeFindings = this.detectLargeComponents(nodes);
    findings.push(...largeFindings);

    // 5. Boundary Violations & Risky Dependencies
    const boundaryFindings = this.detectBoundaryViolations(edges, nodeMap);
    findings.push(...boundaryFindings);

    return findings;
  }

  private detectCircularDependencies(
    nodes: GraphNode[],
    edges: GraphEdge[],
    nodeMap: Map<string, GraphNode>,
  ): DraftFinding[] {
    const findings: DraftFinding[] = [];
    const adj = new Map<string, string[]>();

    for (const node of nodes) {
      adj.set(node.id, []);
    }

    for (const edge of edges) {
      if (
        edge.type === "IMPORTS" ||
        edge.type === "DEPENDS_ON" ||
        edge.type === "CALLS"
      ) {
        const neighbors = adj.get(edge.sourceNodeId);
        if (neighbors) {
          neighbors.push(edge.targetNodeId);
        }
      }
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const pathStack: string[] = [];
    const reportedCycles = new Set<string>();

    const dfs = (u: string) => {
      visited.add(u);
      recursionStack.add(u);
      pathStack.push(u);

      const neighbors = adj.get(u) || [];
      for (const v of neighbors) {
        if (!visited.has(v)) {
          dfs(v);
        } else if (recursionStack.has(v)) {
          // Cycle found! Extract cycle path
          const cycleStartIndex = pathStack.indexOf(v);
          if (cycleStartIndex !== -1) {
            const cycleNodeIds = pathStack.slice(cycleStartIndex);
            const cycleNodeNames = cycleNodeIds
              .map((id) => nodeMap.get(id)?.name || id)
              .join(" → ");

            // Normalize cycle signature to prevent duplicate findings
            const sortedIds = [...cycleNodeIds].sort().join(":");
            if (!reportedCycles.has(sortedIds)) {
              reportedCycles.add(sortedIds);

              const sourceNode = nodeMap.get(cycleNodeIds[0]);
              const targetNode = nodeMap.get(
                cycleNodeIds[cycleNodeIds.length - 1],
              );

              findings.push({
                type: ArchitectureFindingType.CIRCULAR_DEPENDENCY,
                severity: ArchitectureFindingSeverity.HIGH,
                title: `Circular Dependency Detected (${cycleNodeIds.length} nodes)`,
                description: `A circular dependency cycle was detected along path: ${cycleNodeNames} → ${nodeMap.get(v)?.name || v}`,
                confidence: 0.95,
                sourceNodeId: sourceNode?.id,
                targetNodeId: targetNode?.id,
                evidence: {
                  cycleNodeIds,
                  cycleNodeNames,
                  cycleLength: cycleNodeIds.length,
                },
                metadata: { category: "coupling" },
              });
            }
          }
        }
      }

      pathStack.pop();
      recursionStack.delete(u);
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return findings;
  }

  private detectCouplingAndHotspots(
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): DraftFinding[] {
    const findings: DraftFinding[] = [];
    const inbound = new Map<string, string[]>();
    const outbound = new Map<string, string[]>();

    for (const n of nodes) {
      inbound.set(n.id, []);
      outbound.set(n.id, []);
    }

    for (const e of edges) {
      outbound.get(e.sourceNodeId)?.push(e.targetNodeId);
      inbound.get(e.targetNodeId)?.push(e.sourceNodeId);
    }

    // Dynamic coupling threshold based on repo node size
    const avgDegreeThreshold = Math.max(5, Math.ceil(nodes.length * 0.15));

    for (const node of nodes) {
      const inDegree = inbound.get(node.id)?.length || 0;
      const outDegree = outbound.get(node.id)?.length || 0;
      const totalDegree = inDegree + outDegree;

      // Dependency Hotspot
      if (inDegree >= avgDegreeThreshold) {
        findings.push({
          type: ArchitectureFindingType.DEPENDENCY_HOTSPOT,
          severity: ArchitectureFindingSeverity.MEDIUM,
          title: `Dependency Hotspot: ${node.name}`,
          description: `Component '${node.name}' has ${inDegree} incoming dependencies, making it a critical central coupling point.`,
          confidence: 0.9,
          sourceNodeId: node.id,
          evidence: {
            inboundCount: inDegree,
            outboundCount: outDegree,
            dependentNodeIds: inbound.get(node.id),
          },
        });
      }

      // High Coupling
      if (totalDegree >= avgDegreeThreshold * 1.5) {
        findings.push({
          type: ArchitectureFindingType.HIGH_COUPLING,
          severity: ArchitectureFindingSeverity.HIGH,
          title: `Excessive Coupling: ${node.name}`,
          description: `Node '${node.name}' exhibits excessive total degree coupling (${totalDegree} total edges: ${inDegree} in, ${outDegree} out).`,
          confidence: 0.88,
          sourceNodeId: node.id,
          evidence: {
            totalDegree,
            inDegree,
            outDegree,
          },
        });
      }
    }

    return findings;
  }

  private detectOrphanComponents(
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): DraftFinding[] {
    const findings: DraftFinding[] = [];
    const connectedNodes = new Set<string>();

    for (const e of edges) {
      connectedNodes.add(e.sourceNodeId);
      connectedNodes.add(e.targetNodeId);
    }

    for (const node of nodes) {
      if (!connectedNodes.has(node.id)) {
        const path = (node.path || node.name).toLowerCase();
        // Ignore expected standalone files (config, readme, env, main entrypoints)
        if (
          path.includes("readme") ||
          path.includes("config") ||
          path.includes(".env") ||
          path.includes("main.ts") ||
          path.includes("index.ts") ||
          node.type === "REPOSITORY"
        ) {
          continue;
        }

        findings.push({
          type: ArchitectureFindingType.ORPHAN_COMPONENT,
          severity: ArchitectureFindingSeverity.LOW,
          title: `Orphan Component: ${node.name}`,
          description: `Component '${node.name}' has no inbound or outbound graph connections.`,
          confidence: 0.8,
          sourceNodeId: node.id,
          evidence: { path: node.path },
        });
      }
    }

    return findings;
  }

  private detectLargeComponents(nodes: GraphNode[]): DraftFinding[] {
    const findings: DraftFinding[] = [];
    const dirCountMap = new Map<string, number>();

    for (const node of nodes) {
      if (node.path) {
        const parts = node.path.split("/");
        if (parts.length > 1) {
          const dir = parts.slice(0, -1).join("/");
          dirCountMap.set(dir, (dirCountMap.get(dir) || 0) + 1);
        }
      }
    }

    for (const [dir, count] of dirCountMap.entries()) {
      if (count > 25) {
        findings.push({
          type: ArchitectureFindingType.LARGE_COMPONENT,
          severity: ArchitectureFindingSeverity.LOW,
          title: `Oversized Directory/Module: ${dir}`,
          description: `Directory '${dir}' contains an unusually high number of files (${count} files), suggesting it should be modularized.`,
          confidence: 0.85,
          evidence: { directory: dir, fileCount: count },
        });
      }
    }

    return findings;
  }

  private detectBoundaryViolations(
    edges: GraphEdge[],
    nodeMap: Map<string, GraphNode>,
  ): DraftFinding[] {
    const findings: DraftFinding[] = [];

    for (const edge of edges) {
      const source = nodeMap.get(edge.sourceNodeId);
      const target = nodeMap.get(edge.targetNodeId);

      if (!source || !target) continue;

      const srcPath = (source.path || "").toLowerCase();
      const tgtPath = (target.path || "").toLowerCase();

      // Frontend importing backend implementation files
      if (srcPath.startsWith("frontend/") && tgtPath.startsWith("backend/")) {
        findings.push({
          type: ArchitectureFindingType.BOUNDARY_VIOLATION,
          severity: ArchitectureFindingSeverity.CRITICAL,
          title: `Architectural Boundary Violation: Frontend imports Backend code`,
          description: `Frontend component '${source.name}' directly imports backend file '${target.name}'.`,
          confidence: 0.98,
          sourceNodeId: source.id,
          targetNodeId: target.id,
          evidence: {
            sourcePath: source.path,
            targetPath: target.path,
            edgeType: edge.type,
          },
        });
      }

      // Risky dependency: Database/Persistence importing Frontend or UI components
      if (
        (srcPath.includes("prisma") || srcPath.includes("database")) &&
        tgtPath.startsWith("frontend/")
      ) {
        findings.push({
          type: ArchitectureFindingType.RISKY_DEPENDENCY,
          severity: ArchitectureFindingSeverity.HIGH,
          title: `Risky Dependency: Database module depends on Frontend UI`,
          description: `Database layer file '${source.name}' depends on frontend component '${target.name}'.`,
          confidence: 0.92,
          sourceNodeId: source.id,
          targetNodeId: target.id,
          evidence: {
            sourcePath: source.path,
            targetPath: target.path,
          },
        });
      }
    }

    return findings;
  }
}

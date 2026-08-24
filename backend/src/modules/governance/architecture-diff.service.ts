import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  ArchitectureDiffItemType,
  GovernanceRuleSeverity,
} from "@prisma/client";

export interface DiffComparisonResult {
  riskDelta: number;
  riskTrend: "IMPROVED" | "UNCHANGED" | "DEGRADED";
  addedNodes: string[];
  removedNodes: string[];
  addedEdges: Array<{ source: string; target: string; type: string }>;
  removedEdges: Array<{ source: string; target: string; type: string }>;
  newFindings: number;
  resolvedFindings: number;
  summaryText: string;
}

@Injectable()
export class ArchitectureDiffService {
  constructor(private readonly prisma: PrismaService) {}

  async compareSnapshots(
    repositoryId: string,
    fromSnapshotId: string,
    toSnapshotId: string,
  ) {
    const [fromSnapshot, toSnapshot] = await Promise.all([
      this.prisma.architectureSnapshot.findUnique({
        where: { id: fromSnapshotId },
        include: {
          nodes: true,
          edges: true,
          architectureAnalysis: { include: { findings: true } },
        },
      }),
      this.prisma.architectureSnapshot.findUnique({
        where: { id: toSnapshotId },
        include: {
          nodes: true,
          edges: true,
          architectureAnalysis: { include: { findings: true } },
        },
      }),
    ]);

    if (!fromSnapshot || !toSnapshot) {
      throw new Error("One or both snapshots for comparison do not exist");
    }

    const riskDelta = toSnapshot.riskScore - fromSnapshot.riskScore;

    const diff = await this.prisma.architectureDiff.create({
      data: {
        repositoryId,
        fromSnapshotId,
        toSnapshotId,
        status: "SUCCESS",
        riskDelta,
        summary: {
          fromVersion: fromSnapshot.version,
          toVersion: toSnapshot.version,
          fromRisk: fromSnapshot.riskScore,
          toRisk: toSnapshot.riskScore,
        },
      },
    });

    const items: Array<{
      type: ArchitectureDiffItemType;
      category: string;
      severity: GovernanceRuleSeverity;
      title: string;
      description: string;
      sourceNodeName?: string;
      targetNodeName?: string;
      evidence?: any;
    }> = [];

    // 1. Node Comparison
    const fromNodeNames = new Set(
      fromSnapshot.nodes.map((n) => n.qualifiedName),
    );
    const toNodeNames = new Set(toSnapshot.nodes.map((n) => n.qualifiedName));

    for (const node of toSnapshot.nodes) {
      if (!fromNodeNames.has(node.qualifiedName)) {
        items.push({
          type: ArchitectureDiffItemType.ADDED,
          category: "NODE",
          severity: GovernanceRuleSeverity.INFO,
          title: `Added Component: ${node.name}`,
          description: `New ${node.type} component ${node.qualifiedName} introduced.`,
          sourceNodeName: node.name,
        });
      }
    }

    for (const node of fromSnapshot.nodes) {
      if (!toNodeNames.has(node.qualifiedName)) {
        items.push({
          type: ArchitectureDiffItemType.REMOVED,
          category: "NODE",
          severity: GovernanceRuleSeverity.INFO,
          title: `Removed Component: ${node.name}`,
          description: `${node.type} component ${node.qualifiedName} was removed.`,
          sourceNodeName: node.name,
        });
      }
    }

    // 2. Edge Comparison
    const fromEdgeKeys = new Set(
      fromSnapshot.edges.map(
        (e) => `${e.sourceQualifiedName}->${e.targetQualifiedName}:${e.type}`,
      ),
    );
    const toEdgeKeys = new Set(
      toSnapshot.edges.map(
        (e) => `${e.sourceQualifiedName}->${e.targetQualifiedName}:${e.type}`,
      ),
    );

    for (const edge of toSnapshot.edges) {
      const key = `${edge.sourceQualifiedName}->${edge.targetQualifiedName}:${edge.type}`;
      if (!fromEdgeKeys.has(key)) {
        items.push({
          type: ArchitectureDiffItemType.DEPENDENCY_ADDED,
          category: "EDGE",
          severity: GovernanceRuleSeverity.MEDIUM,
          title: `Added Dependency: ${edge.sourceQualifiedName} -> ${edge.targetQualifiedName}`,
          description: `New ${edge.type} relationship created.`,
          sourceNodeName: edge.sourceQualifiedName,
          targetNodeName: edge.targetQualifiedName,
        });
      }
    }

    for (const edge of fromSnapshot.edges) {
      const key = `${edge.sourceQualifiedName}->${edge.targetQualifiedName}:${edge.type}`;
      if (!toEdgeKeys.has(key)) {
        items.push({
          type: ArchitectureDiffItemType.DEPENDENCY_REMOVED,
          category: "EDGE",
          severity: GovernanceRuleSeverity.INFO,
          title: `Removed Dependency: ${edge.sourceQualifiedName} -> ${edge.targetQualifiedName}`,
          description: `${edge.type} relationship removed.`,
          sourceNodeName: edge.sourceQualifiedName,
          targetNodeName: edge.targetQualifiedName,
        });
      }
    }

    // 3. Risk Change Item
    if (Math.abs(riskDelta) > 0.01) {
      const severity =
        riskDelta > 10
          ? GovernanceRuleSeverity.HIGH
          : riskDelta > 0
            ? GovernanceRuleSeverity.MEDIUM
            : GovernanceRuleSeverity.INFO;

      items.push({
        type: ArchitectureDiffItemType.RISK_CHANGED,
        category: "RISK",
        severity,
        title: `Architecture Risk ${riskDelta > 0 ? "Increased" : "Decreased"} by ${Math.abs(riskDelta).toFixed(1)} pts`,
        description: `Risk score changed from ${fromSnapshot.riskScore} → ${toSnapshot.riskScore}.`,
      });
    }

    // Persist diff items
    for (const item of items) {
      await this.prisma.architectureDiffItem.create({
        data: {
          diffId: diff.id,
          type: item.type,
          category: item.category,
          severity: item.severity,
          title: item.title,
          description: item.description,
          sourceNodeName: item.sourceNodeName || null,
          targetNodeName: item.targetNodeName || null,
          evidence: item.evidence || undefined,
        },
      });
    }

    return this.getDiffDetail(diff.id);
  }

  async getDiffDetail(diffId: string) {
    return this.prisma.architectureDiff.findUnique({
      where: { id: diffId },
      include: {
        fromSnapshot: true,
        toSnapshot: true,
        items: true,
        violations: true,
      },
    });
  }

  async listDiffs(repositoryId: string) {
    return this.prisma.architectureDiff.findMany({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
      include: {
        fromSnapshot: { select: { version: true, label: true } },
        toSnapshot: { select: { version: true, label: true } },
        _count: { select: { items: true, violations: true } },
      },
    });
  }
}

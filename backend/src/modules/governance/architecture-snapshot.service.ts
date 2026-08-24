import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class ArchitectureSnapshotService {
  private readonly logger = new Logger(ArchitectureSnapshotService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSnapshot(
    repositoryId: string,
    label: string,
    commitSha?: string,
    branch?: string,
  ) {
    const [latestAnalysis, latestSystemDesign, nodes, edges] =
      await Promise.all([
        this.prisma.architectureAnalysis.findFirst({
          where: { repositoryId, status: "SUCCESS" },
          orderBy: { completedAt: "desc" },
        }),
        this.prisma.systemDesign.findFirst({
          where: { repositoryId },
          orderBy: { version: "desc" },
        }),
        this.prisma.graphNode.findMany({ where: { repositoryId } }),
        this.prisma.graphEdge.findMany({ where: { repositoryId } }),
      ]);

    const latestSnapshot = await this.prisma.architectureSnapshot.findFirst({
      where: { repositoryId },
      orderBy: { version: "desc" },
    });

    const version = (latestSnapshot?.version || 0) + 1;

    // Create ArchitectureSnapshot
    const snapshot = await this.prisma.architectureSnapshot.create({
      data: {
        repositoryId,
        architectureAnalysisId: latestAnalysis?.id || null,
        systemDesignId: latestSystemDesign?.id || null,
        version,
        label,
        commitSha: commitSha || null,
        branch: branch || null,
        nodesCount: nodes.length,
        edgesCount: edges.length,
        componentsCount: latestAnalysis?.nodesAnalyzed || nodes.length,
        findingsCount: latestAnalysis?.findingsGenerated || 0,
        riskScore: latestAnalysis?.riskScore || 0.0,
        riskLevel: latestAnalysis?.riskLevel || "LOW",
        metadata: {
          analysisId: latestAnalysis?.id,
          systemDesignId: latestSystemDesign?.id,
        },
      },
    });

    // Create Snapshot Nodes
    for (const node of nodes) {
      await this.prisma.architectureSnapshotNode.create({
        data: {
          snapshotId: snapshot.id,
          graphNodeId: node.id,
          qualifiedName: node.qualifiedName,
          type: node.type,
          name: node.name,
          path: node.path,
          metadata: (node.metadata as any) || undefined,
        },
      });
    }

    // Create Snapshot Edges
    const nodeMap = new Map(nodes.map((n) => [n.id, n.qualifiedName]));

    for (const edge of edges) {
      const srcQualified = nodeMap.get(edge.sourceNodeId);
      const tgtQualified = nodeMap.get(edge.targetNodeId);

      if (srcQualified && tgtQualified) {
        await this.prisma.architectureSnapshotEdge.create({
          data: {
            snapshotId: snapshot.id,
            sourceQualifiedName: srcQualified,
            targetQualifiedName: tgtQualified,
            type: edge.type,
            metadata: (edge.metadata as any) || undefined,
          },
        });
      }
    }

    this.logger.log(
      `Created ArchitectureSnapshot v${version} for repo ${repositoryId}`,
    );

    return this.getSnapshot(snapshot.id);
  }

  async getSnapshot(snapshotId: string) {
    return this.prisma.architectureSnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        nodes: true,
        edges: true,
        architectureAnalysis: {
          include: { findings: true },
        },
      },
    });
  }

  async getLatestSnapshot(repositoryId: string) {
    return this.prisma.architectureSnapshot.findFirst({
      where: { repositoryId },
      orderBy: { version: "desc" },
      include: {
        nodes: true,
        edges: true,
        architectureAnalysis: {
          include: { findings: true },
        },
      },
    });
  }

  async listSnapshots(repositoryId: string) {
    return this.prisma.architectureSnapshot.findMany({
      where: { repositoryId },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        label: true,
        commitSha: true,
        branch: true,
        nodesCount: true,
        edgesCount: true,
        riskScore: true,
        riskLevel: true,
        createdAt: true,
      },
    });
  }
}

import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { KnowledgeGraphService } from "../knowledge-graph/knowledge-graph.service.js";
import { SystemDesignDiscoveryService } from "./system-design-discovery.service.js";
import { DiagramGenerationService } from "./diagram-generation.service.js";
import { DiagramLayoutService } from "./diagram-layout.service.js";
import * as crypto from "crypto";

@Injectable()
export class SystemDesignService {
  private readonly logger = new Logger(SystemDesignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly knowledgeGraphService: KnowledgeGraphService,
    private readonly discoveryService: SystemDesignDiscoveryService,
    private readonly generationService: DiagramGenerationService,
    private readonly layoutService: DiagramLayoutService,
  ) {}

  async generateSystemDesign(userId: string, repositoryId: string) {
    // 1. Ownership check
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    // 2. Redis locking
    const redis = this.redisService.getClient();
    const lockKey = `system-design:generate-lock:${repositoryId}`;
    const lockValue = crypto.randomUUID();

    const acquired = await redis.set(lockKey, lockValue, "EX", 600, "NX");
    if (!acquired) {
      throw new ConflictException(
        "System design generation is already in progress for this repository",
      );
    }

    try {
      // Fetch latest version number
      const latestDesign = await this.prisma.systemDesign.findFirst({
        where: { repositoryId },
        orderBy: { version: "desc" },
      });

      const version = (latestDesign?.version || 0) + 1;

      // Create SystemDesign record
      const systemDesign = await this.prisma.systemDesign.create({
        data: {
          repositoryId,
          name: `System Design v${version}`,
          description: `Automatically generated C4 architecture design for version ${version}`,
          version,
          generatedAt: new Date(),
        },
      });

      // Fetch Graph Data
      const [nodes, edges] = await Promise.all([
        this.prisma.graphNode.findMany({ where: { repositoryId } }),
        this.prisma.graphEdge.findMany({ where: { repositoryId } }),
      ]);

      // Discovery & Generation
      const { elements, relationships } =
        this.discoveryService.discoverSystemElements(nodes, edges);

      const generatedDiagrams = this.generationService.generateAllDiagrams(
        elements,
        relationships,
      );

      // Persist Diagrams, Nodes, and Edges
      for (const diagData of generatedDiagrams) {
        const diagram = await this.prisma.diagram.create({
          data: {
            systemDesignId: systemDesign.id,
            type: diagData.type,
            name: diagData.name,
            description: diagData.description,
          },
        });

        const createdNodeMap = new Map<string, string>();

        for (const n of diagData.nodes) {
          const createdNode = await this.prisma.diagramNode.create({
            data: {
              diagramId: diagram.id,
              graphNodeId: n.graphNodeId || null,
              type: n.type,
              name: n.name,
              label: n.label,
              description: n.description,
              x: n.x,
              y: n.y,
              width: n.width,
              height: n.height,
              metadata: n.metadata || undefined,
            },
          });

          createdNodeMap.set(n.name, createdNode.id);
        }

        for (const e of diagData.edges) {
          const sourceId = createdNodeMap.get(e.sourceName);
          const targetId = createdNodeMap.get(e.targetName);

          if (sourceId && targetId) {
            await this.prisma.diagramEdge.create({
              data: {
                diagramId: diagram.id,
                sourceNodeId: sourceId,
                targetNodeId: targetId,
                type: e.type,
                label: e.label || null,
                metadata: e.metadata || undefined,
              },
            });
          }
        }
      }

      return {
        systemDesignId: systemDesign.id,
        version: systemDesign.version,
        generatedAt: systemDesign.generatedAt,
        diagramCount: generatedDiagrams.length,
      };
    } finally {
      // Safe Redis lock release
      try {
        const val = await redis.get(lockKey);
        if (val === lockValue) {
          await redis.del(lockKey);
        }
      } catch (err) {
        this.logger.error("Failed releasing Redis system design lock", err);
      }
    }
  }

  async getLatestSystemDesign(userId: string, repositoryId: string) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    const latest = await this.prisma.systemDesign.findFirst({
      where: { repositoryId },
      orderBy: { version: "desc" },
      include: {
        diagrams: {
          include: {
            _count: {
              select: { nodes: true, edges: true },
            },
          },
        },
      },
    });

    if (!latest) {
      return {
        repositoryId,
        status: "NOT_GENERATED",
        version: 0,
        diagrams: [],
      };
    }

    return {
      systemDesignId: latest.id,
      repositoryId: latest.repositoryId,
      name: latest.name,
      version: latest.version,
      generatedAt: latest.generatedAt,
      diagrams: latest.diagrams.map((d) => ({
        id: d.id,
        type: d.type,
        name: d.name,
        description: d.description,
        nodeCount: d._count.nodes,
        edgeCount: d._count.edges,
      })),
    };
  }

  async getDiagrams(userId: string, repositoryId: string) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    const latest = await this.prisma.systemDesign.findFirst({
      where: { repositoryId },
      orderBy: { version: "desc" },
    });

    if (!latest) {
      return { diagrams: [] };
    }

    return this.prisma.diagram.findMany({
      where: { systemDesignId: latest.id },
      include: {
        nodes: true,
        edges: {
          include: {
            sourceNode: true,
            targetNode: true,
          },
        },
      },
    });
  }

  async getDiagramDetail(
    userId: string,
    repositoryId: string,
    diagramId: string,
  ) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    const diagram = await this.prisma.diagram.findFirst({
      where: { id: diagramId, systemDesign: { repositoryId } },
      include: {
        nodes: {
          include: { graphNode: true },
        },
        edges: {
          include: {
            sourceNode: true,
            targetNode: true,
          },
        },
      },
    });

    if (!diagram) {
      throw new NotFoundException("Diagram not found in this repository");
    }

    return diagram;
  }

  async updateNodePosition(
    userId: string,
    repositoryId: string,
    diagramId: string,
    nodeId: string,
    pos: { x: number; y: number },
  ) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    const node = await this.prisma.diagramNode.findFirst({
      where: {
        id: nodeId,
        diagramId,
        diagram: { systemDesign: { repositoryId } },
      },
    });

    if (!node) {
      throw new NotFoundException("Diagram node not found");
    }

    return this.prisma.diagramNode.update({
      where: { id: nodeId },
      data: { x: pos.x, y: pos.y },
    });
  }

  async resetLayout(userId: string, repositoryId: string, diagramId: string) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    const diagram = await this.prisma.diagram.findFirst({
      where: { id: diagramId, systemDesign: { repositoryId } },
      include: { nodes: true },
    });

    if (!diagram) {
      throw new NotFoundException("Diagram not found");
    }

    const recomputed = this.layoutService.computeDeterministicLayout(
      diagram.nodes.map((n) => ({ id: n.id, name: n.name, type: n.type })),
      diagram.type,
    );

    for (const p of recomputed) {
      await this.prisma.diagramNode.update({
        where: { id: p.id },
        data: { x: p.x, y: p.y },
      });
    }

    return { success: true, resetNodes: recomputed.length };
  }

  async deleteSystemDesign(userId: string, repositoryId: string) {
    await this.knowledgeGraphService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    await this.prisma.systemDesign.deleteMany({
      where: { repositoryId },
    });

    return { success: true };
  }
}

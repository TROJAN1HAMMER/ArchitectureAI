import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { NodeType, EdgeType } from "@prisma/client";

export interface UpsertNodeInput {
  repositoryId: string;
  qualifiedName: string;
  name: string;
  type: NodeType;
  fileId?: string | null;
  path?: string | null;
  metadata?: any;
}

export interface UpsertEdgeInput {
  repositoryId: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: EdgeType;
  metadata?: any;
}

export interface GetNodesQuery {
  type?: NodeType;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GetEdgesQuery {
  sourceNodeId?: string;
  targetNodeId?: string;
  type?: EdgeType;
  limit?: number;
  offset?: number;
}

@Injectable()
export class KnowledgeGraphService {
  constructor(private readonly prisma: PrismaService) {}

  public async verifyRepositoryOwnership(userId: string, repositoryId: string) {
    const connection = await this.prisma.repositoryConnection.findUnique({
      where: {
        userId_repositoryId: {
          userId,
          repositoryId,
        },
      },
    });

    if (!connection || connection.disconnectedAt) {
      throw new NotFoundException("Repository not found");
    }

    return connection;
  }

  async upsertNode(data: UpsertNodeInput) {
    return this.prisma.graphNode.upsert({
      where: {
        repositoryId_qualifiedName: {
          repositoryId: data.repositoryId,
          qualifiedName: data.qualifiedName,
        },
      },
      create: {
        repositoryId: data.repositoryId,
        qualifiedName: data.qualifiedName,
        name: data.name,
        type: data.type,
        fileId: data.fileId || null,
        path: data.path || null,
        metadata: data.metadata || undefined,
      },
      update: {
        name: data.name,
        type: data.type,
        fileId: data.fileId || null,
        path: data.path || null,
        metadata: data.metadata || undefined,
      },
    });
  }

  async upsertEdge(data: UpsertEdgeInput) {
    return this.prisma.graphEdge.upsert({
      where: {
        repositoryId_sourceNodeId_targetNodeId_type: {
          repositoryId: data.repositoryId,
          sourceNodeId: data.sourceNodeId,
          targetNodeId: data.targetNodeId,
          type: data.type,
        },
      },
      create: {
        repositoryId: data.repositoryId,
        sourceNodeId: data.sourceNodeId,
        targetNodeId: data.targetNodeId,
        type: data.type,
        metadata: data.metadata || undefined,
      },
      update: {
        metadata: data.metadata || undefined,
      },
    });
  }

  async clearRepositoryGraph(repositoryId: string) {
    await this.prisma.graphEdge.deleteMany({ where: { repositoryId } });
    await this.prisma.graphNode.deleteMany({ where: { repositoryId } });
  }

  async getGraphSummary(userId: string, repositoryId: string) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    const [
      totalNodes,
      totalEdges,
      nodeBreakdownRaw,
      edgeBreakdownRaw,
      latestNode,
    ] = await Promise.all([
      this.prisma.graphNode.count({ where: { repositoryId } }),
      this.prisma.graphEdge.count({ where: { repositoryId } }),
      this.prisma.graphNode.groupBy({
        by: ["type"],
        where: { repositoryId },
        _count: { _all: true },
      }),
      this.prisma.graphEdge.groupBy({
        by: ["type"],
        where: { repositoryId },
        _count: { _all: true },
      }),
      this.prisma.graphNode.findFirst({
        where: { repositoryId },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const nodeTypeBreakdown: Record<string, number> = {};
    for (const item of nodeBreakdownRaw) {
      nodeTypeBreakdown[item.type] = item._count._all;
    }

    const edgeTypeBreakdown: Record<string, number> = {};
    for (const item of edgeBreakdownRaw) {
      edgeTypeBreakdown[item.type] = item._count._all;
    }

    return {
      repositoryId,
      nodes: totalNodes,
      edges: totalEdges,
      nodeTypeBreakdown,
      edgeTypeBreakdown,
      lastBuiltAt: latestNode?.updatedAt || null,
      status: totalNodes > 0 ? "READY" : "EMPTY",
    };
  }

  async getNodes(
    userId: string,
    repositoryId: string,
    query: GetNodesQuery = {},
  ) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    const limit = Math.min(Math.max(1, query.limit || 50), 200);
    const offset = Math.max(0, query.offset || 0);

    const where: any = { repositoryId };
    if (query.type) {
      where.type = query.type;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { qualifiedName: { contains: query.search, mode: "insensitive" } },
        { path: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [nodes, totalCount] = await Promise.all([
      this.prisma.graphNode.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ type: "asc" }, { name: "asc" }],
      }),
      this.prisma.graphNode.count({ where }),
    ]);

    return {
      nodes,
      totalCount,
      limit,
      offset,
    };
  }

  async getEdges(
    userId: string,
    repositoryId: string,
    query: GetEdgesQuery = {},
  ) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    const limit = Math.min(Math.max(1, query.limit || 50), 200);
    const offset = Math.max(0, query.offset || 0);

    const where: any = { repositoryId };
    if (query.type) {
      where.type = query.type;
    }
    if (query.sourceNodeId) {
      where.sourceNodeId = query.sourceNodeId;
    }
    if (query.targetNodeId) {
      where.targetNodeId = query.targetNodeId;
    }

    const [edges, totalCount] = await Promise.all([
      this.prisma.graphEdge.findMany({
        where,
        include: {
          sourceNode: true,
          targetNode: true,
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.graphEdge.count({ where }),
    ]);

    return {
      edges,
      totalCount,
      limit,
      offset,
    };
  }

  async getNeighborhood(
    userId: string,
    repositoryId: string,
    nodeId: string,
    _depth = 1,
  ) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    const centerNode = await this.prisma.graphNode.findFirst({
      where: { id: nodeId, repositoryId },
    });

    if (!centerNode) {
      throw new NotFoundException("Graph node not found in this repository");
    }

    const [outgoing, incoming] = await Promise.all([
      this.prisma.graphEdge.findMany({
        where: { repositoryId, sourceNodeId: nodeId },
        include: { targetNode: true },
      }),
      this.prisma.graphEdge.findMany({
        where: { repositoryId, targetNodeId: nodeId },
        include: { sourceNode: true },
      }),
    ]);

    const connectedNodesMap = new Map<string, any>();
    const edgesList: any[] = [];

    for (const edge of outgoing) {
      connectedNodesMap.set(edge.targetNode.id, edge.targetNode);
      edgesList.push({
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        type: edge.type,
        direction: "outgoing",
      });
    }

    for (const edge of incoming) {
      connectedNodesMap.set(edge.sourceNode.id, edge.sourceNode);
      edgesList.push({
        id: edge.id,
        sourceNodeId: edge.sourceNodeId,
        targetNodeId: edge.targetNodeId,
        type: edge.type,
        direction: "incoming",
      });
    }

    return {
      centerNode,
      connectedNodes: Array.from(connectedNodesMap.values()),
      edges: edgesList,
    };
  }
}

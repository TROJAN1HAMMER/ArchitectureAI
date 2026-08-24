import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { KnowledgeGraphService } from "./knowledge-graph.service.js";
import { RepositoryGraphBuilderService } from "./repository-graph-builder.service.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { NodeType, EdgeType } from "@prisma/client";

@ApiTags("Knowledge Graph")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("repositories/:repositoryId/graph")
export class KnowledgeGraphController {
  constructor(
    private readonly knowledgeGraphService: KnowledgeGraphService,
    private readonly repositoryGraphBuilderService: RepositoryGraphBuilderService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get knowledge graph summary for repository" })
  @ApiResponse({ status: 200, description: "Graph summary statistics" })
  async getSummary(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") repositoryId: string,
  ) {
    return this.knowledgeGraphService.getGraphSummary(userId, repositoryId);
  }

  @Post("build")
  @ApiOperation({ summary: "Trigger knowledge graph build" })
  @ApiResponse({ status: 200, description: "Graph build completed" })
  @ApiResponse({ status: 409, description: "Graph build already in progress" })
  async buildGraph(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") repositoryId: string,
  ) {
    const result = await this.repositoryGraphBuilderService.buildGraph(
      userId,
      repositoryId,
    );
    return {
      repositoryId: result.repositoryId,
      status: "RUNNING",
      message: "Graph construction triggered successfully",
    };
  }

  @Get("nodes")
  @ApiOperation({ summary: "Get graph nodes with filtering and search" })
  @ApiQuery({ name: "type", required: false, enum: NodeType })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Graph nodes list" })
  async getNodes(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") repositoryId: string,
    @Query("type") type?: NodeType,
    @Query("search") search?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.knowledgeGraphService.getNodes(userId, repositoryId, {
      type,
      search,
      limit: limitNum,
      offset: offsetNum,
    });
  }

  @Get("edges")
  @ApiOperation({ summary: "Get graph edges with filtering" })
  @ApiQuery({ name: "sourceNodeId", required: false, type: String })
  @ApiQuery({ name: "targetNodeId", required: false, type: String })
  @ApiQuery({ name: "type", required: false, enum: EdgeType })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Graph edges list" })
  async getEdges(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") repositoryId: string,
    @Query("sourceNodeId") sourceNodeId?: string,
    @Query("targetNodeId") targetNodeId?: string,
    @Query("type") type?: EdgeType,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.knowledgeGraphService.getEdges(userId, repositoryId, {
      sourceNodeId,
      targetNodeId,
      type,
      limit: limitNum,
      offset: offsetNum,
    });
  }

  @Get("neighborhood/:nodeId")
  @ApiOperation({ summary: "Get neighborhood sub-graph around a node" })
  @ApiQuery({ name: "depth", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Connected sub-graph" })
  async getNeighborhood(
    @CurrentUser("id") userId: string,
    @Param("repositoryId") repositoryId: string,
    @Param("nodeId") nodeId: string,
    @Query("depth") depth?: string,
  ) {
    const depthNum = depth ? parseInt(depth, 10) : 1;
    return this.knowledgeGraphService.getNeighborhood(
      userId,
      repositoryId,
      nodeId,
      depthNum,
    );
  }
}

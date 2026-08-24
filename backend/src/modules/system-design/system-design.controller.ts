import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { SystemDesignService } from "./system-design.service.js";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

export class UpdateNodePositionDto {
  x!: number;
  y!: number;
}

@ApiTags("System Design Studio")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("repositories/:id/system-design")
export class SystemDesignController {
  constructor(private readonly systemDesignService: SystemDesignService) {}

  @Get()
  @ApiOperation({ summary: "Get current system design summary" })
  async getSummary(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.systemDesignService.getLatestSystemDesign(userId, repositoryId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("generate")
  @ApiOperation({ summary: "Generate or regenerate C4 system design diagrams" })
  async generate(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.systemDesignService.generateSystemDesign(userId, repositoryId);
  }

  @Get("diagrams")
  @ApiOperation({ summary: "List system design diagrams" })
  async getDiagrams(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.systemDesignService.getDiagrams(userId, repositoryId);
  }

  @Get("diagrams/:diagramId")
  @ApiOperation({
    summary: "Get complete diagram details with nodes and edges",
  })
  async getDiagramDetail(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Param("diagramId") diagramId: string,
  ) {
    return this.systemDesignService.getDiagramDetail(
      userId,
      repositoryId,
      diagramId,
    );
  }

  @Patch("diagrams/:diagramId/nodes/:nodeId")
  @ApiOperation({ summary: "Update node canvas position" })
  async updateNodePosition(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Param("diagramId") diagramId: string,
    @Param("nodeId") nodeId: string,
    @Body() body: UpdateNodePositionDto,
  ) {
    return this.systemDesignService.updateNodePosition(
      userId,
      repositoryId,
      diagramId,
      nodeId,
      body,
    );
  }

  @Post("diagrams/:diagramId/reset-layout")
  @ApiOperation({
    summary: "Reset diagram nodes to initial deterministic layout",
  })
  async resetLayout(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Param("diagramId") diagramId: string,
  ) {
    return this.systemDesignService.resetLayout(
      userId,
      repositoryId,
      diagramId,
    );
  }

  @Delete()
  @ApiOperation({ summary: "Delete generated system design" })
  async delete(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.systemDesignService.deleteSystemDesign(userId, repositoryId);
  }
}

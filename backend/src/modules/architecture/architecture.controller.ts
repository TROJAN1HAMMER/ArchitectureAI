import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { ArchitectureAnalysisService } from "./architecture-analysis.service.js";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

@ApiTags("Architecture Intelligence")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("repositories/:id/architecture")
export class ArchitectureController {
  constructor(private readonly analysisService: ArchitectureAnalysisService) {}

  @Get()
  @ApiOperation({ summary: "Get latest architecture analysis summary" })
  async getSummary(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.analysisService.getLatestSummary(userId, repositoryId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("analyze")
  @ApiOperation({
    summary: "Trigger background architecture discovery and auditing analysis",
  })
  async analyze(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.analysisService.runAnalysis(userId, repositoryId);
  }

  @Get("findings")
  @ApiOperation({ summary: "Get filterable architecture findings" })
  async getFindings(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Query("type") type?: string,
    @Query("severity") severity?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const rawLimit = limit ? parseInt(limit, 10) : 50;
    const rawOffset = offset ? parseInt(offset, 10) : 0;
    const limitNum = Math.min(
      Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1),
      100,
    );
    const offsetNum = Math.max(isNaN(rawOffset) ? 0 : rawOffset, 0);

    return this.analysisService.getFindings(userId, repositoryId, {
      type,
      severity,
      limit: limitNum,
      offset: offsetNum,
    });
  }

  @Get("findings/:findingId")
  @ApiOperation({ summary: "Get complete finding evidence detail" })
  async getFindingDetail(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Param("findingId") findingId: string,
  ) {
    return this.analysisService.getFindingDetail(
      userId,
      repositoryId,
      findingId,
    );
  }

  @Get("components")
  @ApiOperation({ summary: "Get discovered architectural components" })
  async getComponents(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.analysisService.getComponents(userId, repositoryId);
  }

  @Get("history")
  @ApiOperation({ summary: "Get architecture analysis run history" })
  async getHistory(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.analysisService.getHistory(userId, repositoryId);
  }
}

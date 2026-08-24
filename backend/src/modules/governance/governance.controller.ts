import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { GovernanceReviewService } from "./governance-review.service.js";
import { ArchitectureSnapshotService } from "./architecture-snapshot.service.js";
import { ArchitectureDiffService } from "./architecture-diff.service.js";
import { GovernanceRuleService } from "./governance-rule.service.js";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  GovernanceRuleSeverity,
  GovernanceViolationStatus,
} from "@prisma/client";
import { Throttle } from "@nestjs/throttler";

@ApiTags("Architecture Governance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("repositories/:id/governance")
export class GovernanceController {
  constructor(
    private readonly reviewService: GovernanceReviewService,
    private readonly snapshotService: ArchitectureSnapshotService,
    private readonly diffService: ArchitectureDiffService,
    private readonly ruleService: GovernanceRuleService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get repository governance summary" })
  async getSummary(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.reviewService.getGovernanceSummary(userId, repositoryId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("review")
  @ApiOperation({ summary: "Run automated architecture governance review" })
  async runReview(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.reviewService.runGovernanceReview(userId, repositoryId);
  }

  @Get("snapshots")
  @ApiOperation({ summary: "List architecture snapshots" })
  async listSnapshots(
    @CurrentUser("id") _userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.snapshotService.listSnapshots(repositoryId);
  }

  @Get("snapshots/:snapshotId")
  @ApiOperation({ summary: "Get snapshot details" })
  async getSnapshot(
    @CurrentUser("id") _userId: string,
    @Param("id") _repositoryId: string,
    @Param("snapshotId") snapshotId: string,
  ) {
    return this.snapshotService.getSnapshot(snapshotId);
  }

  @Get("diffs")
  @ApiOperation({ summary: "List architecture diffs" })
  async listDiffs(
    @CurrentUser("id") _userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.diffService.listDiffs(repositoryId);
  }

  @Get("diffs/:diffId")
  @ApiOperation({ summary: "Get architecture diff detail" })
  async getDiffDetail(
    @CurrentUser("id") _userId: string,
    @Param("id") _repositoryId: string,
    @Param("diffId") diffId: string,
  ) {
    return this.diffService.getDiffDetail(diffId);
  }

  @Get("violations")
  @ApiOperation({ summary: "List governance violations" })
  async listViolations(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Query("severity") severity?: GovernanceRuleSeverity,
    @Query("status") status?: GovernanceViolationStatus,
  ) {
    return this.reviewService.listViolations(userId, repositoryId, {
      severity,
      status,
    });
  }

  @Patch("violations/:violationId")
  @ApiOperation({
    summary: "Update violation status (OPEN, ACKNOWLEDGED, RESOLVED, IGNORED)",
  })
  async updateViolationStatus(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Param("violationId") violationId: string,
    @Body("status") status: GovernanceViolationStatus,
  ) {
    return this.reviewService.updateViolationStatus(
      userId,
      repositoryId,
      violationId,
      status,
    );
  }

  @Get("rules")
  @ApiOperation({ summary: "List governance rules" })
  async listRules(
    @CurrentUser("id") _userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.ruleService.listRules(repositoryId);
  }

  @Post("rules")
  @ApiOperation({ summary: "Create custom governance rule" })
  async createRule(
    @CurrentUser("id") _userId: string,
    @Param("id") repositoryId: string,
    @Body() body: any,
  ) {
    return this.ruleService.createRule(repositoryId, body);
  }

  @Patch("rules/:ruleId")
  @ApiOperation({ summary: "Update governance rule" })
  async updateRule(
    @CurrentUser("id") _userId: string,
    @Param("id") _repositoryId: string,
    @Param("ruleId") ruleId: string,
    @Body() body: any,
  ) {
    return this.ruleService.updateRule(ruleId, body);
  }

  @Delete("rules/:ruleId")
  @ApiOperation({ summary: "Delete custom governance rule" })
  async deleteRule(
    @CurrentUser("id") _userId: string,
    @Param("id") _repositoryId: string,
    @Param("ruleId") ruleId: string,
  ) {
    return this.ruleService.deleteRule(ruleId);
  }
}

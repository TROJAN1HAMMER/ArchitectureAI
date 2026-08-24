import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { RemediationService } from "./remediation.service.js";

import { IsString, IsNotEmpty } from "class-validator";

class CreateRemediationPlanDto {
  @IsString()
  @IsNotEmpty()
  findingId!: string;
}

@Controller("repositories/:id/remediations")
@UseGuards(JwtAuthGuard)
export class RemediationController {
  constructor(private readonly remediationService: RemediationService) {}

  @Get()
  async listRemediations(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.remediationService.listRemediations(userId, repositoryId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPlan(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Body() dto: CreateRemediationPlanDto,
  ) {
    return this.remediationService.createPlan(
      userId,
      repositoryId,
      dto.findingId,
    );
  }

  @Get(":remediationId")
  async getRemediation(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Param("remediationId") remediationId: string,
  ) {
    return this.remediationService.getRemediation(
      userId,
      repositoryId,
      remediationId,
    );
  }

  @Post(":remediationId/generate")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async generatePatches(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Param("remediationId") remediationId: string,
  ) {
    return this.remediationService.generatePatches(
      userId,
      repositoryId,
      remediationId,
    );
  }

  @Post(":remediationId/validate")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async validatePlan(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Param("remediationId") remediationId: string,
  ) {
    return this.remediationService.validatePlan(
      userId,
      repositoryId,
      remediationId,
    );
  }

  @Post(":remediationId/execute")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async executePlan(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Param("remediationId") remediationId: string,
  ) {
    return this.remediationService.executePlan(
      userId,
      repositoryId,
      remediationId,
    );
  }

  @Delete(":remediationId")
  async deletePlan(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Param("remediationId") remediationId: string,
  ) {
    return this.remediationService.deletePlan(
      userId,
      repositoryId,
      remediationId,
    );
  }
}

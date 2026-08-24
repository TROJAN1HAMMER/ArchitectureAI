import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisLockService } from "../../common/redis/redis-lock.service.js";
import { RemediationPlannerService } from "./remediation-planner.service.js";
import { RemediationGeneratorService } from "./remediation-generator.service.js";
import { RemediationValidatorService } from "./remediation-validator.service.js";
import { RemediationExecutorService } from "./remediation-executor.service.js";

@Injectable()
export class RemediationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisLock: RedisLockService,
    private readonly planner: RemediationPlannerService,
    private readonly generator: RemediationGeneratorService,
    private readonly validator: RemediationValidatorService,
    private readonly executor: RemediationExecutorService,
  ) {}

  private async verifyRepositoryOwnership(
    userId: string,
    repositoryId: string,
  ): Promise<void> {
    const connection = await this.prisma.repositoryConnection.findFirst({
      where: { userId, repositoryId, disconnectedAt: null },
    });

    if (!connection) {
      throw new ForbiddenException(
        `User ${userId} does not have access to repository ${repositoryId}`,
      );
    }
  }

  async listRemediations(userId: string, repositoryId: string) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    return this.prisma.remediationPlan.findMany({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
      include: {
        finding: true,
        patches: true,
        validations: true,
        executions: true,
      },
    });
  }

  async getRemediation(
    userId: string,
    repositoryId: string,
    remediationId: string,
  ) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    const plan = await this.prisma.remediationPlan.findFirst({
      where: { id: remediationId, repositoryId },
      include: {
        finding: true,
        patches: true,
        validations: true,
        executions: true,
      },
    });

    if (!plan) {
      throw new NotFoundException(
        `Remediation plan ${remediationId} not found`,
      );
    }

    return plan;
  }

  async createPlan(userId: string, repositoryId: string, findingId: string) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    return this.planner.createPlanForFinding(userId, repositoryId, findingId);
  }

  async generatePatches(
    userId: string,
    repositoryId: string,
    remediationId: string,
  ) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    const lockKey = `repository:remediation-lock:${repositoryId}:${remediationId}`;
    return this.redisLock.runWithLock(
      lockKey,
      600,
      () => this.generator.generatePatchesForPlan(repositoryId, remediationId),
      `Remediation generation is currently in progress for plan ${remediationId}`,
    );
  }

  async validatePlan(
    userId: string,
    repositoryId: string,
    remediationId: string,
  ) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    const lockKey = `repository:remediation-lock:${repositoryId}:${remediationId}`;
    return this.redisLock.runWithLock(
      lockKey,
      600,
      () => this.validator.validateRemediationPlan(repositoryId, remediationId),
      `Remediation validation is currently in progress for plan ${remediationId}`,
    );
  }

  async executePlan(
    userId: string,
    repositoryId: string,
    remediationId: string,
  ) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    const lockKey = `repository:remediation-lock:${repositoryId}:${remediationId}`;
    return this.redisLock.runWithLock(
      lockKey,
      600,
      () => this.executor.executeRemediationPlan(repositoryId, remediationId),
      `Remediation PR execution is currently in progress for plan ${remediationId}`,
    );
  }

  async deletePlan(
    userId: string,
    repositoryId: string,
    remediationId: string,
  ) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    const plan = await this.prisma.remediationPlan.findFirst({
      where: { id: remediationId, repositoryId },
    });

    if (!plan) {
      throw new NotFoundException(
        `Remediation plan ${remediationId} not found`,
      );
    }

    await this.prisma.remediationPlan.delete({
      where: { id: remediationId },
    });

    return {
      success: true,
      message: `Remediation plan ${remediationId} cancelled and deleted`,
    };
  }
}

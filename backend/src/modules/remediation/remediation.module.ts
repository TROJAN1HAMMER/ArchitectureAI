import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { RedisModule } from "../../common/redis/redis.module.js";
import { GithubModule } from "../github/github.module.js";
import { RemediationSafetyService } from "./remediation-safety.service.js";
import { MockRefactoringProviderService } from "./refactoring/mock-refactoring-provider.service.js";
import { RemediationPlannerService } from "./remediation-planner.service.js";
import { RemediationGeneratorService } from "./remediation-generator.service.js";
import { RemediationValidatorService } from "./remediation-validator.service.js";
import { RemediationExecutorService } from "./remediation-executor.service.js";
import { RemediationContextService } from "./remediation-context.service.js";
import { RemediationService } from "./remediation.service.js";
import { RemediationController } from "./remediation.controller.js";

@Module({
  imports: [PrismaModule, RedisModule, GithubModule],
  controllers: [RemediationController],
  providers: [
    RemediationSafetyService,
    MockRefactoringProviderService,
    RemediationPlannerService,
    RemediationGeneratorService,
    RemediationValidatorService,
    RemediationExecutorService,
    RemediationContextService,
    RemediationService,
  ],
  exports: [
    RemediationService,
    RemediationContextService,
    RemediationPlannerService,
    RemediationSafetyService,
  ],
})
export class RemediationModule {}

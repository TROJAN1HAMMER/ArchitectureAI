import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { RedisModule } from "../../common/redis/redis.module.js";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module.js";
import { GovernanceController } from "./governance.controller.js";
import { ArchitectureSnapshotService } from "./architecture-snapshot.service.js";
import { ArchitectureDiffService } from "./architecture-diff.service.js";
import { GovernanceRuleService } from "./governance-rule.service.js";
import { GovernanceEngineService } from "./governance-engine.service.js";
import { GovernanceReviewService } from "./governance-review.service.js";
import { GovernanceContextService } from "./governance-context.service.js";

@Module({
  imports: [PrismaModule, RedisModule, KnowledgeGraphModule],
  controllers: [GovernanceController],
  providers: [
    ArchitectureSnapshotService,
    ArchitectureDiffService,
    GovernanceRuleService,
    GovernanceEngineService,
    GovernanceReviewService,
    GovernanceContextService,
  ],
  exports: [
    GovernanceReviewService,
    GovernanceContextService,
    ArchitectureSnapshotService,
    ArchitectureDiffService,
  ],
})
export class GovernanceModule {}

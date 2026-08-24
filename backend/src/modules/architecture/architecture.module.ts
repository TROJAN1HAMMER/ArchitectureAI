import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { RedisModule } from "../../common/redis/redis.module.js";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module.js";
import { ArchitectureController } from "./architecture.controller.js";
import { ArchitectureDiscoveryService } from "./architecture-discovery.service.js";
import { ArchitectureAuditorService } from "./architecture-auditor.service.js";
import { ArchitecturePatternService } from "./architecture-pattern.service.js";
import { ArchitectureRiskService } from "./architecture-risk.service.js";
import { ArchitectureAnalysisService } from "./architecture-analysis.service.js";
import { ArchitectureContextService } from "./architecture-context.service.js";

@Module({
  imports: [PrismaModule, RedisModule, KnowledgeGraphModule],
  controllers: [ArchitectureController],
  providers: [
    ArchitectureDiscoveryService,
    ArchitectureAuditorService,
    ArchitecturePatternService,
    ArchitectureRiskService,
    ArchitectureAnalysisService,
    ArchitectureContextService,
  ],
  exports: [
    ArchitectureAnalysisService,
    ArchitectureContextService,
    ArchitectureDiscoveryService,
  ],
})
export class ArchitectureModule {}

import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { RedisModule } from "../../common/redis/redis.module.js";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module.js";
import { SystemDesignController } from "./system-design.controller.js";
import { SystemDesignDiscoveryService } from "./system-design-discovery.service.js";
import { DiagramGenerationService } from "./diagram-generation.service.js";
import { DiagramLayoutService } from "./diagram-layout.service.js";
import { SystemDesignService } from "./system-design.service.js";
import { SystemDesignContextService } from "./system-design-context.service.js";

@Module({
  imports: [PrismaModule, RedisModule, KnowledgeGraphModule],
  controllers: [SystemDesignController],
  providers: [
    SystemDesignDiscoveryService,
    DiagramGenerationService,
    DiagramLayoutService,
    SystemDesignService,
    SystemDesignContextService,
  ],
  exports: [SystemDesignService, SystemDesignContextService],
})
export class SystemDesignModule {}

import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { RedisModule } from "../../common/redis/redis.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { KnowledgeGraphService } from "./knowledge-graph.service.js";
import { RepositoryGraphBuilderService } from "./repository-graph-builder.service.js";
import { KnowledgeGraphController } from "./knowledge-graph.controller.js";

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  controllers: [KnowledgeGraphController],
  providers: [KnowledgeGraphService, RepositoryGraphBuilderService],
  exports: [KnowledgeGraphService, RepositoryGraphBuilderService],
})
export class KnowledgeGraphModule {}

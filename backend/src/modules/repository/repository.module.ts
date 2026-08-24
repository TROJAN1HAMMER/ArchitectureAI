import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { GithubModule } from "../github/github.module.js";
import { RedisModule } from "../../common/redis/redis.module.js";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module.js";
import { RepositoriesController } from "./repositories.controller.js";
import { RepositoriesService } from "./repositories.service.js";
import { RepositorySyncService } from "./repository-sync.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [
    PrismaModule,
    GithubModule,
    RedisModule,
    AuthModule,
    KnowledgeGraphModule,
  ],
  controllers: [RepositoriesController],
  providers: [RepositoriesService, RepositorySyncService],
  exports: [RepositoriesService, RepositorySyncService],
})
export class RepositoryModule {}

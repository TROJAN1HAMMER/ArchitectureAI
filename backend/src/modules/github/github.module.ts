import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { RedisModule } from "../../common/redis/redis.module.js";
import { LoggerModule } from "../../common/logger/logger.module.js";
import { GithubClientService } from "./github-client.service.js";
import { GithubService } from "./github.service.js";
import { GithubController } from "./github.controller.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, LoggerModule, AuthModule],
  controllers: [GithubController],
  providers: [GithubClientService, GithubService],
  exports: [GithubClientService, GithubService],
})
export class GithubModule {}

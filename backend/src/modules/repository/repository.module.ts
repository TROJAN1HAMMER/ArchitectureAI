import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { GithubModule } from "../github/github.module.js";
import { RepositoriesController } from "./repositories.controller.js";
import { RepositoriesService } from "./repositories.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [PrismaModule, GithubModule, AuthModule],
  controllers: [RepositoriesController],
  providers: [RepositoriesService],
  exports: [RepositoriesService],
})
export class RepositoryModule {}

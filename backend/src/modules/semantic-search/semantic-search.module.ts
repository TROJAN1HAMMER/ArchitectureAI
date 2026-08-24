import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { RedisModule } from "../../common/redis/redis.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { MockEmbeddingProviderService } from "./embedding/mock-embedding-provider.service.js";
import { EmbeddingService } from "./embedding/embedding.service.js";
import { SearchableContentService } from "./content/searchable-content.service.js";
import { SemanticIndexerService } from "./semantic-indexer.service.js";
import { SemanticSearchService } from "./semantic-search.service.js";
import { SemanticSearchController } from "./semantic-search.controller.js";

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  controllers: [SemanticSearchController],
  providers: [
    MockEmbeddingProviderService,
    EmbeddingService,
    SearchableContentService,
    SemanticIndexerService,
    SemanticSearchService,
  ],
  exports: [
    EmbeddingService,
    SearchableContentService,
    SemanticIndexerService,
    SemanticSearchService,
  ],
})
export class SemanticSearchModule {}

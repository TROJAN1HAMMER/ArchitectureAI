import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { RedisModule } from "../../common/redis/redis.module.js";
import { SemanticSearchModule } from "../semantic-search/semantic-search.module.js";
import { KnowledgeGraphModule } from "../knowledge-graph/knowledge-graph.module.js";
import { ArchitectureModule } from "../architecture/architecture.module.js";
import { SystemDesignModule } from "../system-design/system-design.module.js";
import { AiController } from "./ai.controller.js";
import { RagService } from "./rag/rag.service.js";
import { QueryUnderstandingService } from "./rag/query-understanding.service.js";
import { ContextRetrieverService } from "./rag/context-retriever.service.js";
import { ContextRankerService } from "./rag/context-ranker.service.js";
import { ContextBuilderService } from "./rag/context-builder.service.js";
import { ConversationService } from "./conversation/conversation.service.js";
import { MockLLMProviderService } from "./llm/mock-llm-provider.service.js";
import { LLMProviderFactory } from "./llm/llm-provider.factory.js";

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    SemanticSearchModule,
    KnowledgeGraphModule,
    ArchitectureModule,
    SystemDesignModule,
  ],
  controllers: [AiController],
  providers: [
    RagService,
    QueryUnderstandingService,
    ContextRetrieverService,
    ContextRankerService,
    ContextBuilderService,
    ConversationService,
    MockLLMProviderService,
    LLMProviderFactory,
  ],
  exports: [RagService, ConversationService],
})
export class AiModule {}

import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { RedisService } from "../../../common/redis/redis.service.js";
import { QueryUnderstandingService } from "./query-understanding.service.js";
import { ContextRetrieverService } from "./context-retriever.service.js";
import { ContextRankerService } from "./context-ranker.service.js";
import { ContextBuilderService } from "./context-builder.service.js";
import { ArchitectureContextService } from "../../architecture/architecture-context.service.js";
import { SystemDesignContextService } from "../../system-design/system-design-context.service.js";
import { GovernanceContextService } from "../../governance/governance-context.service.js";
import { RemediationContextService } from "../../remediation/remediation-context.service.js";
import { LLMProviderFactory } from "../llm/llm-provider.factory.js";
import { ConversationService } from "../conversation/conversation.service.js";
import { MessageRole } from "@prisma/client";
import * as crypto from "crypto";

export interface RAGChatResult {
  conversationId: string;
  message: {
    id: string;
    role: MessageRole;
    content: string;
    createdAt: Date;
  };
  sources: Array<{
    fileId: string | null;
    path: string;
    score: number;
    reason: string;
    graphConnections?: Array<{ nodeName: string; type: string }>;
  }>;
  meta: {
    model: string;
    provider: string;
    sourcesUsed: number;
    queryIntent: string;
  };
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly queryUnderstandingService: QueryUnderstandingService,
    private readonly contextRetrieverService: ContextRetrieverService,
    private readonly contextRankerService: ContextRankerService,
    private readonly contextBuilderService: ContextBuilderService,
    private readonly architectureContextService: ArchitectureContextService,
    private readonly systemDesignContextService: SystemDesignContextService,
    private readonly governanceContextService: GovernanceContextService,
    private readonly remediationContextService: RemediationContextService,
    private readonly llmProviderFactory: LLMProviderFactory,
    private readonly conversationService: ConversationService,
  ) {}

  async processChat(
    userId: string,
    repositoryId: string,
    userQuery: string,
    existingConversationId?: string,
  ): Promise<RAGChatResult> {
    // 1. Ownership check
    const connection = await this.prisma.repositoryConnection.findUnique({
      where: { userId_repositoryId: { userId, repositoryId } },
      include: { repository: true },
    });

    if (!connection) {
      throw new NotFoundException("Repository not found or access denied");
    }

    // 2. Redis locking
    const redis = this.redisService.getClient();
    const lockKey = `repository:ai-lock:${repositoryId}:${userId}`;
    const lockValue = crypto.randomUUID();

    const acquired = await redis.set(lockKey, lockValue, "EX", 60, "NX");
    if (!acquired) {
      throw new ConflictException(
        "An AI request is already in progress for this repository",
      );
    }

    try {
      // 3. Resolve or create conversation
      let conversation;
      if (existingConversationId) {
        conversation = await this.conversationService.getConversation(
          userId,
          existingConversationId,
        );
      } else {
        const titleSnippet =
          userQuery.length > 30
            ? `${userQuery.substring(0, 30)}...`
            : userQuery;
        conversation = await this.conversationService.createConversation(
          userId,
          repositoryId,
          titleSnippet,
        );
      }

      // 4. Persist USER message
      await this.conversationService.appendMessage(
        conversation.id,
        MessageRole.USER,
        userQuery,
      );

      // 5. Query Understanding
      const parsedQuery = this.queryUnderstandingService.parseQuery(userQuery);

      // 6. Context Retrieval
      const candidates = await this.contextRetrieverService.retrieveContext(
        userId,
        repositoryId,
        parsedQuery,
      );

      // 7. Context Ranking
      const rankedCandidates = this.contextRankerService.rankContext(
        candidates,
        parsedQuery,
      );

      // 8. Context Building
      const builtContext = this.contextBuilderService.buildContext(
        connection.repository.fullName,
        rankedCandidates,
      );

      let fullContextBlock = builtContext.contextBlock;
      const lowerQ = userQuery.toLowerCase();

      // Architecture Context
      if (
        parsedQuery.intent === "architecture" ||
        lowerQ.includes("risk") ||
        lowerQ.includes("finding") ||
        lowerQ.includes("pattern") ||
        lowerQ.includes("coupling") ||
        lowerQ.includes("cycle")
      ) {
        const archContext =
          await this.architectureContextService.getArchitectureContext(
            userId,
            repositoryId,
          );
        fullContextBlock = `${archContext}\n\n${fullContextBlock}`;
      }

      // System Design Context
      if (
        lowerQ.includes("diagram") ||
        lowerQ.includes("container") ||
        lowerQ.includes("system design") ||
        lowerQ.includes("component") ||
        lowerQ.includes("c4")
      ) {
        const sysDesignContext =
          await this.systemDesignContextService.getSystemDesignContext(
            userId,
            repositoryId,
          );
        fullContextBlock = `${sysDesignContext}\n\n${fullContextBlock}`;
      }

      // Governance Context
      if (
        lowerQ.includes("governance") ||
        lowerQ.includes("violation") ||
        lowerQ.includes("rule") ||
        lowerQ.includes("diff") ||
        lowerQ.includes("change") ||
        lowerQ.includes("review")
      ) {
        const govContext =
          await this.governanceContextService.getGovernanceContext(
            userId,
            repositoryId,
          );
        fullContextBlock = `${govContext}\n\n${fullContextBlock}`;
      }

      // Remediation Context
      if (
        lowerQ.includes("remediation") ||
        lowerQ.includes("fix") ||
        lowerQ.includes("patch") ||
        lowerQ.includes("refactor") ||
        lowerQ.includes("pull request") ||
        lowerQ.includes("pr")
      ) {
        const remContext =
          await this.remediationContextService.getRemediationContext(
            repositoryId,
          );
        fullContextBlock = `${remContext}\n\n${fullContextBlock}`;
      }

      const systemPrompt = this.contextBuilderService.buildSystemPrompt();

      // 9. LLM Provider Execution
      const provider = this.llmProviderFactory.getProvider();
      const llmResponse = await provider.generate({
        systemPrompt,
        userPrompt: userQuery,
        context: fullContextBlock,
      });

      // 10. Persist ASSISTANT message
      const assistantMessage = await this.conversationService.appendMessage(
        conversation.id,
        MessageRole.ASSISTANT,
        llmResponse.content,
        {
          sources: builtContext.sources,
          provider: llmResponse.provider,
          model: llmResponse.model,
        },
      );

      return {
        conversationId: conversation.id,
        message: {
          id: assistantMessage.id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt,
        },
        sources: builtContext.sources.map((s) => ({
          fileId: s.fileId,
          path: s.path,
          score: s.relevanceScore,
          reason: s.reason,
          graphConnections: s.graphConnections,
        })),
        meta: {
          model: llmResponse.model,
          provider: llmResponse.provider,
          sourcesUsed: builtContext.sourcesUsed,
          queryIntent: parsedQuery.intent,
        },
      };
    } finally {
      // Release lock safely
      try {
        const currentValue = await redis.get(lockKey);
        if (currentValue === lockValue) {
          await redis.del(lockKey);
        }
      } catch (err) {
        this.logger.error("Failed releasing Redis AI lock", err);
      }
    }
  }
}

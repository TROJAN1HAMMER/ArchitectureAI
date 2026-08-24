import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { RagService } from "./rag/rag.service.js";
import { ConversationService } from "./conversation/conversation.service.js";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class AIChatDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsOptional()
  conversationId?: string;
}

@ApiTags("AI Assistant")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("repositories/:id/ai")
export class AiController {
  constructor(
    private readonly ragService: RagService,
    private readonly conversationService: ConversationService,
  ) {}

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Post("chat")
  @ApiOperation({
    summary: "Send a natural language query to the AI repository assistant",
  })
  async chat(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
    @Body() dto: AIChatDto,
  ) {
    if (!dto.message || !dto.message.trim()) {
      throw new BadRequestException("Message content is required");
    }

    return this.ragService.processChat(
      userId,
      repositoryId,
      dto.message.trim(),
      dto.conversationId,
    );
  }

  @Get("conversations")
  @ApiOperation({ summary: "List user conversations for a repository" })
  async listConversations(
    @CurrentUser("id") userId: string,
    @Param("id") repositoryId: string,
  ) {
    return this.conversationService.getConversations(userId, repositoryId);
  }

  @Get("conversations/:conversationId")
  @ApiOperation({ summary: "Get conversation history and messages" })
  async getConversation(
    @CurrentUser("id") userId: string,
    @Param("conversationId") conversationId: string,
  ) {
    return this.conversationService.getConversation(userId, conversationId);
  }

  @Delete("conversations/:conversationId")
  @ApiOperation({ summary: "Delete a conversation" })
  async deleteConversation(
    @CurrentUser("id") userId: string,
    @Param("conversationId") conversationId: string,
  ) {
    return this.conversationService.deleteConversation(userId, conversationId);
  }
}

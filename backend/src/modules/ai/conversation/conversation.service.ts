import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { MessageRole } from "@prisma/client";

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(
    userId: string,
    repositoryId: string,
    title: string,
  ) {
    await this.verifyRepositoryAccess(userId, repositoryId);

    return this.prisma.conversation.create({
      data: {
        userId,
        repositoryId,
        title: title || "New Conversation",
      },
    });
  }

  async getConversations(userId: string, repositoryId: string) {
    await this.verifyRepositoryAccess(userId, repositoryId);

    return this.prisma.conversation.findMany({
      where: { userId, repositoryId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(
        "You do not have access to this conversation",
      );
    }

    return conversation;
  }

  async appendMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
    metadata?: any,
  ) {
    const message = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        role,
        content,
        metadata: metadata || undefined,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(
        "You do not have access to this conversation",
      );
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  private async verifyRepositoryAccess(
    userId: string,
    repositoryId: string,
  ): Promise<void> {
    const connection = await this.prisma.repositoryConnection.findUnique({
      where: {
        userId_repositoryId: { userId, repositoryId },
      },
    });

    if (!connection) {
      throw new NotFoundException("Repository not found or access denied");
    }
  }
}

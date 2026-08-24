import { Test, TestingModule } from "@nestjs/testing";
import { ConversationService } from "./conversation.service.js";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { ForbiddenException } from "@nestjs/common";

describe("ConversationService Unit Tests", () => {
  let service: ConversationService;

  const mockPrismaService = {
    repositoryConnection: {
      findUnique: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    conversationMessage: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  it("should create conversation if user has access to repository", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-1",
    });
    mockPrismaService.conversation.create.mockResolvedValue({
      id: "conv-1",
      title: "Auth Chat",
    });

    const res = await service.createConversation(
      "user-1",
      "repo-1",
      "Auth Chat",
    );
    expect(res.id).toBe("conv-1");
  });

  it("should throw ForbiddenException if user accesses another user's conversation", async () => {
    mockPrismaService.conversation.findUnique.mockResolvedValue({
      id: "conv-1",
      userId: "other-user",
    });

    await expect(service.getConversation("user-1", "conv-1")).rejects.toThrow(
      ForbiddenException,
    );
  });
});

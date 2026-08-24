import { Test, TestingModule } from "@nestjs/testing";
import { AiController } from "./ai.controller.js";
import { RagService } from "./rag/rag.service.js";
import { ConversationService } from "./conversation/conversation.service.js";
import { BadRequestException } from "@nestjs/common";

describe("AiController Unit Tests", () => {
  let controller: AiController;

  const mockRagService = {
    processChat: jest.fn().mockResolvedValue({
      conversationId: "conv-1",
      message: { role: "ASSISTANT", content: "answer" },
      sources: [],
      meta: {},
    }),
  };

  const mockConversationService = {
    getConversations: jest.fn().mockResolvedValue([]),
    getConversation: jest
      .fn()
      .mockResolvedValue({ id: "conv-1", messages: [] }),
    deleteConversation: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: RagService, useValue: mockRagService },
        { provide: ConversationService, useValue: mockConversationService },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  it("should throw BadRequestException if message body is empty", async () => {
    await expect(
      controller.chat("user-1", "repo-1", { message: "" }),
    ).rejects.toThrow(BadRequestException);
  });

  it("should process valid chat request", async () => {
    const res = await controller.chat("user-1", "repo-1", { message: "auth" });
    expect(res.conversationId).toBe("conv-1");
    expect(mockRagService.processChat).toHaveBeenCalledWith(
      "user-1",
      "repo-1",
      "auth",
      undefined,
    );
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { RagService } from "./rag.service.js";
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
import { ConflictException } from "@nestjs/common";

describe("RagService Unit Tests", () => {
  let service: RagService;

  const mockRedisClient = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    repositoryConnection: {
      findUnique: jest.fn(),
    },
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  const mockQueryUnderstandingService = {
    parseQuery: jest.fn().mockReturnValue({
      normalizedQuery: "auth",
      keywords: ["auth"],
      intent: "security",
      likelyNodeTypes: [],
      likelyEdgeTypes: [],
    }),
  };

  const mockContextRetrieverService = {
    retrieveContext: jest.fn().mockResolvedValue([]),
  };

  const mockContextRankerService = {
    rankContext: jest.fn().mockReturnValue([]),
  };

  const mockContextBuilderService = {
    buildContext: jest.fn().mockReturnValue({
      contextBlock: "No relevant content",
      sources: [],
      characterCount: 18,
      sourcesUsed: 0,
    }),
    buildSystemPrompt: jest.fn().mockReturnValue("System prompt"),
  };

  const mockArchitectureContextService = {
    getArchitectureContext: jest
      .fn()
      .mockResolvedValue("Mock Architecture Context"),
  };

  const mockLLMProvider = {
    generate: jest.fn().mockResolvedValue({
      content: "I couldn't find enough evidence.",
      model: "mock",
      provider: "mock",
    }),
  };

  const mockLLMProviderFactory = {
    getProvider: jest.fn().mockReturnValue(mockLLMProvider),
  };

  const mockConversationService = {
    createConversation: jest.fn().mockResolvedValue({ id: "conv-1" }),
    getConversation: jest.fn().mockResolvedValue({ id: "conv-1" }),
    appendMessage: jest.fn().mockResolvedValue({
      id: "msg-1",
      role: "ASSISTANT",
      content: "I couldn't find enough evidence.",
      createdAt: new Date(),
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: QueryUnderstandingService,
          useValue: mockQueryUnderstandingService,
        },
        {
          provide: ContextRetrieverService,
          useValue: mockContextRetrieverService,
        },
        { provide: ContextRankerService, useValue: mockContextRankerService },
        { provide: ContextBuilderService, useValue: mockContextBuilderService },
        {
          provide: ArchitectureContextService,
          useValue: mockArchitectureContextService,
        },
        {
          provide: SystemDesignContextService,
          useValue: {
            getSystemDesignContext: jest
              .fn()
              .mockResolvedValue("Mock System Design Context"),
          },
        },
        {
          provide: GovernanceContextService,
          useValue: { getGovernanceContext: jest.fn().mockResolvedValue("") },
        },
        {
          provide: RemediationContextService,
          useValue: { getRemediationContext: jest.fn().mockResolvedValue("") },
        },
        { provide: LLMProviderFactory, useValue: mockLLMProviderFactory },
        { provide: ConversationService, useValue: mockConversationService },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  it("should throw ConflictException if Redis AI lock is already held", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-1",
      repository: { fullName: "owner/repo" },
    });
    mockRedisClient.set.mockResolvedValue(null); // Lock acquisition fails

    await expect(
      service.processChat("user-1", "repo-1", "auth"),
    ).rejects.toThrow(ConflictException);
  });

  it("should process chat end-to-end and release Redis lock", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-1",
      repository: { fullName: "owner/repo" },
    });
    mockRedisClient.set.mockResolvedValue("OK");
    mockRedisClient.get.mockImplementation(async () => {
      return mockRedisClient.set.mock.calls[0][1];
    });

    const res = await service.processChat(
      "user-1",
      "repo-1",
      "How does auth work?",
    );

    expect(res.conversationId).toBe("conv-1");
    expect(res.meta.provider).toBe("mock");
    expect(mockRedisClient.del).toHaveBeenCalled();
  });
});

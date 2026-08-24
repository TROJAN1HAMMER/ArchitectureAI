import { Test, TestingModule } from "@nestjs/testing";
import { GithubService } from "./github.service.js";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { GithubCallbackDto } from "./dto/github-callback.dto.js";

jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { GithubClientService } from "./github-client.service.js";
import { ConfigService } from "@nestjs/config";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";

describe("GithubService Unit Tests", () => {
  let service: GithubService;

  const mockRedisClient = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    gitHubAccount: {
      upsert: jest.fn().mockResolvedValue({
        id: "account-123",
        userId: "user-123",
        githubUserId: "github-123",
        username: "test-user",
        email: "test@example.com",
      }),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockGithubClient = {
    getAccessToken: jest.fn().mockResolvedValue("token-123"),
    getUser: jest.fn().mockResolvedValue({
      githubUserId: "github-123",
      username: "test-user",
      email: "test@example.com",
      profileUrl: "https://github.com/test-user",
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.GITHUB_OAUTH_ENCRYPTION_KEY =
      "12345678901234567890123456789012";

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: {
            getClient: () => mockRedisClient,
          },
        },
        {
          provide: GithubClientService,
          useValue: mockGithubClient,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "GITHUB_CLIENT_ID") return "valid_client_id_123";
              if (key === "GITHUB_CLIENT_SECRET")
                return "valid_client_secret_456";
              if (key === "GITHUB_CALLBACK_URL")
                return "http://localhost:3001/api/v1/github/callback";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
  });

  it("1. should throw BadRequestException when GitHub OAuth credentials are unconfigured or dummy", async () => {
    const unconfiguredModule: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: RedisService,
          useValue: { getClient: () => mockRedisClient },
        },
        { provide: GithubClientService, useValue: mockGithubClient },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "GITHUB_CLIENT_ID") return "dummy_client_id";
              if (key === "GITHUB_CLIENT_SECRET") return "dummy_client_secret";
              if (key === "GITHUB_CALLBACK_URL")
                return "http://localhost:3001/api/v1/github/callback";
              return null;
            }),
          },
        },
      ],
    }).compile();

    const unconfiguredService =
      unconfiguredModule.get<GithubService>(GithubService);
    await expect(unconfiguredService.getConnectUrl("user-123")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("2. should generate valid connection redirect URL and cache state in Redis", async () => {
    const url = await service.getConnectUrl("user-123");
    expect(url).toContain("valid_client_id_123");
    expect(url).toContain("redirect_uri");
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      expect.stringContaining("oauth:state:"),
      "user-123",
      "EX",
      300,
    );
  });

  it("3. should throw UnauthorizedException on expired or invalid OAuth state", async () => {
    mockRedisClient.get.mockResolvedValue(null);
    await expect(
      service.handleCallback("code-123", "invalid-state"),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("4. should validate callback code/state, delete state from Redis, and upsert account details", async () => {
    mockRedisClient.get.mockResolvedValue("user-123");

    const res = await service.handleCallback("code-123", "valid-state");

    expect(mockRedisClient.get).toHaveBeenCalledWith("oauth:state:valid-state");
    expect(mockRedisClient.del).toHaveBeenCalledWith("oauth:state:valid-state");
    expect(mockGithubClient.getAccessToken).toHaveBeenCalledWith("code-123");
    expect(mockGithubClient.getUser).toHaveBeenCalledWith("token-123");
    expect(mockPrismaService.gitHubAccount.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-123" },
        create: expect.objectContaining({
          githubUserId: "github-123",
          username: "test-user",
        }),
      }),
    );
    expect(res).toBeDefined();
  });

  it("5. should validate GithubCallbackDto containing code, state, and iss without validation errors", async () => {
    const callbackPayload = {
      code: "123456789",
      state: "valid-state",
      iss: "https://github.com/login/oauth",
    };

    const dtoInstance = plainToInstance(GithubCallbackDto, callbackPayload);
    const errors = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.length).toBe(0);
    expect(dtoInstance.code).toBe("123456789");
    expect(dtoInstance.state).toBe("valid-state");
    expect(dtoInstance.iss).toBe("https://github.com/login/oauth");
  });
});

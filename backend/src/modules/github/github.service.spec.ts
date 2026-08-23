import { Test, TestingModule } from "@nestjs/testing";
import { GithubService } from "./github.service.js";

jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { GithubClientService } from "./github-client.service.js";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";

describe("GithubService Unit Tests", () => {
  let service: GithubService;
  let client: GithubClientService;

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
              if (key === "GITHUB_CLIENT_ID") return "client-id";
              if (key === "GITHUB_CALLBACK_URL")
                return "http://localhost:3000/callback";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
    client = module.get<GithubClientService>(GithubClientService);
  });

  it("should generate connection redirect URL and cache state", async () => {
    const url = await service.getConnectUrl("user-123");
    expect(url).toContain("client-id");
    expect(url).toContain("redirect_uri");
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      expect.stringContaining("oauth:state:"),
      "user-123",
      "EX",
      300,
    );
  });

  it("should validate callback code/state, delete state from Redis, and upsert account details", async () => {
    mockRedisClient.get.mockResolvedValue("user-123");

    const account = await service.handleCallback("code-abc", "state-xyz");

    expect(account).toBeDefined();
    expect(mockRedisClient.del).toHaveBeenCalled();
    expect(client.getAccessToken).toHaveBeenCalledWith("code-abc");
    expect(client.getUser).toHaveBeenCalledWith("token-123");
    expect(mockPrismaService.gitHubAccount.upsert).toHaveBeenCalled();
  });

  it("should fail callback if state is not cached in Redis (expired or invalid)", async () => {
    mockRedisClient.get.mockResolvedValue(null);
    await expect(
      service.handleCallback("code-abc", "state-xyz"),
    ).rejects.toThrow(UnauthorizedException);
  });
});

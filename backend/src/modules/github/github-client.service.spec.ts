import { Test, TestingModule } from "@nestjs/testing";
import { GithubClientService } from "./github-client.service.js";
import { ConfigService } from "@nestjs/config";
import { BadRequestException } from "@nestjs/common";

jest.mock("octokit", () => {
  return {
    Octokit: jest.fn().mockImplementation(() => {
      return {
        rest: {
          users: {
            getAuthenticated: jest.fn().mockResolvedValue({
              data: {
                id: 12345,
                login: "test-user",
                email: "test@example.com",
                html_url: "https://github.com/test-user",
              },
            }),
          },
          repos: {
            listForAuthenticatedUser: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 9999,
                  name: "test-repo",
                  full_name: "test-user/test-repo",
                  owner: { login: "test-user" },
                  description: "my description",
                  html_url: "https://github.com/test-user/test-repo",
                  default_branch: "main",
                  visibility: "public",
                  private: false,
                },
              ],
            }),
            get: jest.fn().mockResolvedValue({
              data: {
                id: 9999,
                name: "test-repo",
                full_name: "test-user/test-repo",
                owner: { login: "test-user" },
                description: "my description",
                html_url: "https://github.com/test-user/test-repo",
                default_branch: "main",
                visibility: "public",
                private: false,
                language: "TypeScript",
                stargazers_count: 42,
                forks_count: 5,
                archived: false,
              },
            }),
          },
          git: {
            getTree: jest.fn().mockResolvedValue({
              data: {
                tree: [
                  {
                    path: "src",
                    type: "tree",
                    sha: "tree-sha-1",
                    size: 0,
                  },
                  {
                    path: "src/main.ts",
                    type: "blob",
                    sha: "blob-sha-2",
                    size: 1024,
                  },
                ],
              },
            }),
          },
        },
      };
    }),
  };
});

describe("GithubClientService Unit Tests", () => {
  let service: GithubClientService;

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        access_token: "mock-access-token-456",
      }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubClientService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "GITHUB_CLIENT_ID") return "valid_client_id";
              if (key === "GITHUB_CLIENT_SECRET") return "valid_client_secret";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GithubClientService>(GithubClientService);
  });

  it("1. should throw BadRequestException when credentials are dummy or missing", async () => {
    const unconfiguredModule: TestingModule = await Test.createTestingModule({
      providers: [
        GithubClientService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "GITHUB_CLIENT_ID") return "dummy_client_id";
              if (key === "GITHUB_CLIENT_SECRET") return "dummy_client_secret";
              return null;
            }),
          },
        },
      ],
    }).compile();

    const unconfiguredService =
      unconfiguredModule.get<GithubClientService>(GithubClientService);
    await expect(
      unconfiguredService.getAccessToken("code-123"),
    ).rejects.toThrow(BadRequestException);
  });

  it("2. should exchange authorization code for access token", async () => {
    const token = await service.getAccessToken("valid-code");
    expect(token).toBe("mock-access-token-456");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://github.com/login/oauth/access_token",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("3. should handle GitHub OAuth exchange error response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        error: "bad_verification_code",
        error_description: "The code passed is incorrect or expired.",
      }),
    });

    await expect(service.getAccessToken("expired-code")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("4. should fetch authenticated GitHub user profile", async () => {
    const user = await service.getUser("mock-access-token-456");
    expect(user.githubUserId).toBe("12345");
    expect(user.username).toBe("test-user");
  });
});

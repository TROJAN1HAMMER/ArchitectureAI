import { Test, TestingModule } from "@nestjs/testing";
import { GithubClientService } from "./github-client.service.js";
import { ConfigService } from "@nestjs/config";

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
              if (key === "GITHUB_CLIENT_ID") return "mock-client-id";
              if (key === "GITHUB_CLIENT_SECRET") return "mock-client-secret";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GithubClientService>(GithubClientService);
  });

  it("should exchange code for access token successfully", async () => {
    const token = await service.getAccessToken("auth-code-123");
    expect(token).toBe("mock-access-token-456");
    expect(global.fetch).toHaveBeenCalled();
  });

  it("should retrieve authenticated user profile details successfully", async () => {
    const profile = await service.getUser("token-123");
    expect(profile).toEqual({
      githubUserId: "12345",
      username: "test-user",
      email: "test@example.com",
      profileUrl: "https://github.com/test-user",
    });
  });

  it("should retrieve available repositories successfully", async () => {
    const repos = await service.getRepositories("token-123");
    expect(repos.length).toBe(1);
    expect(repos[0].githubRepositoryId).toBe("9999");
    expect(repos[0].name).toBe("test-repo");
  });

  it("should retrieve single repository details successfully", async () => {
    const repo = await service.getRepository(
      "token-123",
      "test-user",
      "test-repo",
    );
    expect(repo.githubRepositoryId).toBe("9999");
    expect(repo.name).toBe("test-repo");
  });
});

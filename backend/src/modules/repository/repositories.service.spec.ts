import { Test, TestingModule } from "@nestjs/testing";
import { RepositoriesService } from "./repositories.service.js";

jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));
import { PrismaService } from "../../prisma/prisma.service.js";
import { GithubService } from "../github/github.service.js";
import { GithubClientService } from "../github/github-client.service.js";
import { ForbiddenException } from "@nestjs/common";
import { SyncStatus, SyncTrigger } from "@prisma/client";

describe("RepositoriesService Unit Tests", () => {
  let service: RepositoriesService;

  const mockPrismaService = {
    repository: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({
        id: "repo-123",
        githubRepositoryId: "9999",
        ownerLogin: "owner",
        name: "repo",
      }),
      update: jest.fn(),
      delete: jest.fn(),
    },
    repositoryConnection: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest
        .fn()
        .mockResolvedValue({ id: "conn-123", connectedAt: new Date() }),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    repositorySync: {
      create: jest.fn().mockResolvedValue({ id: "sync-123" }),
      update: jest.fn(),
    },
  };

  const mockGithubService = {
    getDecryptedToken: jest.fn().mockResolvedValue("decrypted-token-abc"),
  };

  const mockGithubClient = {
    getRepositories: jest.fn().mockResolvedValue([
      {
        githubRepositoryId: "9999",
        name: "repo",
        fullName: "owner/repo",
        ownerLogin: "owner",
      },
    ]),
    getRepository: jest.fn().mockResolvedValue({
      githubRepositoryId: "9999",
      ownerLogin: "owner",
      name: "repo",
      fullName: "owner/repo",
      defaultBranch: "main",
      visibility: "public",
      isPrivate: false,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GithubService,
          useValue: mockGithubService,
        },
        {
          provide: GithubClientService,
          useValue: mockGithubClient,
        },
      ],
    }).compile();

    service = module.get<RepositoriesService>(RepositoriesService);
  });

  it("should list available repositories with connected statuses mapped correctly", async () => {
    const list = await service.getAvailableFromGithub("user-123");
    expect(list.length).toBe(1);
    expect(list[0].connected).toBe(false);
  });

  it("should connect a repository and initialize sync and connection entries", async () => {
    mockPrismaService.repository.findUnique.mockResolvedValue(null);
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue(null);

    const result = await service.connectRepository("user-123", "owner", "repo");
    expect(result.name).toBe("repo");
    expect(mockPrismaService.repository.create).toHaveBeenCalled();
    expect(mockPrismaService.repositoryConnection.create).toHaveBeenCalled();
    expect(mockPrismaService.repositorySync.create).toHaveBeenCalled();
  });

  it("should fail disconnect if connection does not exist (ownership guard / IDOR)", async () => {
    mockPrismaService.repository.findUnique.mockResolvedValue({
      id: "repo-123",
    });
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue(null);

    await expect(
      service.disconnectRepository("user-123", "repo-123"),
    ).rejects.toThrow(ForbiddenException);
  });

  it("should sync metadata and log successful sync state", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-123",
      repository: { id: "repo-123", ownerLogin: "owner", name: "repo" },
    });

    const result = await service.syncRepositoryMetadata("user-123", "repo-123");
    expect(result.status).toBe("SUCCESS");
    expect(mockPrismaService.repositorySync.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SyncStatus.RUNNING,
          trigger: SyncTrigger.MANUAL,
        }),
      }),
    );
    expect(mockPrismaService.repositorySync.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SyncStatus.SUCCESS,
        }),
      }),
    );
  });
});

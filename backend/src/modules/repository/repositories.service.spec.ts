import { Test, TestingModule } from "@nestjs/testing";
import { RepositoriesService } from "./repositories.service.js";

jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));

import { PrismaService } from "../../prisma/prisma.service.js";
import { GithubService } from "../github/github.service.js";
import { GithubClientService } from "../github/github-client.service.js";
import { RepositorySyncService } from "./repository-sync.service.js";
import { NotFoundException } from "@nestjs/common";
import { SyncStatus } from "@prisma/client";

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
        fullName: "owner/repo",
        defaultBranch: "main",
        visibility: "public",
        isPrivate: false,
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
      findFirst: jest.fn().mockResolvedValue({ status: SyncStatus.SUCCESS }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    repositoryFile: {
      count: jest.fn().mockResolvedValue(15),
      findMany: jest.fn().mockResolvedValue([]),
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
      language: "TypeScript",
      stargazersCount: 5,
      forksCount: 1,
      archived: false,
    }),
  };

  const mockRepositorySyncService = {
    syncRepository: jest.fn().mockResolvedValue({
      status: SyncStatus.SUCCESS,
      lastSyncedAt: new Date(),
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoriesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GithubService, useValue: mockGithubService },
        { provide: GithubClientService, useValue: mockGithubClient },
        { provide: RepositorySyncService, useValue: mockRepositorySyncService },
      ],
    }).compile();

    service = module.get<RepositoriesService>(RepositoriesService);
  });

  it("should list available repositories with connected statuses mapped correctly", async () => {
    const list = await service.getAvailableFromGithub("user-123");
    expect(list.length).toBe(1);
    expect(list[0].connected).toBe(false);
  });

  it("should connect a repository and trigger initial sync", async () => {
    mockPrismaService.repository.findUnique.mockResolvedValue(null);
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue(null);

    const result = await service.connectRepository("user-123", "owner", "repo");
    expect(result.name).toBe("repo");
    expect(mockPrismaService.repository.create).toHaveBeenCalled();
    expect(mockPrismaService.repositoryConnection.create).toHaveBeenCalled();
    expect(mockRepositorySyncService.syncRepository).toHaveBeenCalled();
  });

  it("should fail disconnect if connection does not exist (ownership guard / IDOR)", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue(null);

    await expect(
      service.disconnectRepository("user-123", "repo-123"),
    ).rejects.toThrow(NotFoundException);
  });

  it("should retrieve single repository details by ID for authorized user", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-123",
      repository: {
        id: "repo-123",
        githubRepositoryId: "9999",
        ownerLogin: "owner",
        name: "repo",
        fullName: "owner/repo",
        defaultBranch: "main",
        visibility: "public",
        isPrivate: false,
        language: "TypeScript",
        stars: 10,
        forks: 2,
        isArchived: false,
        htmlUrl: "https://github.com/owner/repo",
        lastSyncedAt: new Date(),
      },
    });

    const detail = await service.getRepositoryById("user-123", "repo-123");
    expect(detail.id).toBe("repo-123");
    expect(detail.fileCount).toBe(15);
    expect(detail.syncStatus).toBe(SyncStatus.SUCCESS);
  });

  it("should retrieve repository file tree for authorized user", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-123",
      repository: { id: "repo-123" },
    });
    mockPrismaService.repositoryFile.findMany.mockResolvedValue([
      { id: "file-1", path: "src/main.ts", name: "main.ts" },
    ]);

    const result = await service.getRepositoryTree("user-123", "repo-123");
    expect(result.files.length).toBe(1);
    expect(result.files[0].path).toBe("src/main.ts");
  });

  it("should delegate metadata and tree synchronization to RepositorySyncService", async () => {
    const result = await service.syncRepositoryMetadata("user-123", "repo-123");
    expect(mockRepositorySyncService.syncRepository).toHaveBeenCalledWith(
      "user-123",
      "repo-123",
      expect.anything(),
    );
    expect(result.status).toBe(SyncStatus.SUCCESS);
  });
});

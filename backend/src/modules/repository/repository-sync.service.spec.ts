jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));

import { Test, TestingModule } from "@nestjs/testing";
import { RepositorySyncService } from "./repository-sync.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { GithubService } from "../github/github.service.js";
import { GithubClientService } from "../github/github-client.service.js";
import { ConflictException, ForbiddenException } from "@nestjs/common";
import { SyncStatus, SyncTrigger } from "@prisma/client";

describe("RepositorySyncService Unit Tests", () => {
  let service: RepositorySyncService;

  const mockRedisClient = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    repositoryConnection: {
      findUnique: jest.fn(),
    },
    repository: {
      update: jest.fn(),
    },
    repositorySync: {
      create: jest.fn(),
      update: jest.fn(),
    },
    repositoryFile: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  const mockGithubService = {
    getDecryptedToken: jest.fn().mockResolvedValue("mock-decrypted-token"),
  };

  const mockGithubClient = {
    getRepository: jest.fn().mockResolvedValue({
      githubRepositoryId: "9999",
      ownerLogin: "test-owner",
      name: "test-repo",
      fullName: "test-owner/test-repo",
      description: "desc",
      htmlUrl: "https://github.com/test-owner/test-repo",
      defaultBranch: "main",
      visibility: "public",
      isPrivate: false,
      language: "TypeScript",
      stargazersCount: 10,
      forksCount: 2,
      archived: false,
    }),
    getRepositoryTree: jest.fn().mockResolvedValue([
      {
        path: "src",
        name: "src",
        extension: null,
        size: 0,
        sha: "sha-1",
        type: "tree",
        parentPath: null,
      },
      {
        path: "src/index.ts",
        name: "index.ts",
        extension: "ts",
        size: 250,
        sha: "sha-2",
        type: "blob",
        parentPath: "src",
      },
    ]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositorySyncService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: GithubService, useValue: mockGithubService },
        { provide: GithubClientService, useValue: mockGithubClient },
      ],
    }).compile();

    service = module.get<RepositorySyncService>(RepositorySyncService);
  });

  it("should throw ForbiddenException if user has no connection to the repository", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue(null);

    await expect(service.syncRepository("user-1", "repo-1")).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("should throw ConflictException if Redis sync lock is already held", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-1",
      repository: { id: "repo-1", ownerLogin: "owner", name: "repo" },
    });
    mockRedisClient.set.mockResolvedValue(null); // Lock acquisition fails

    await expect(service.syncRepository("user-1", "repo-1")).rejects.toThrow(
      ConflictException,
    );
  });

  it("should execute full sync successfully, store tree, and release Redis lock", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-1",
      repository: { id: "repo-1", ownerLogin: "owner", name: "repo" },
    });
    mockRedisClient.set.mockResolvedValue("OK");
    mockPrismaService.repositorySync.create.mockResolvedValue({
      id: "sync-100",
    });
    mockPrismaService.repositorySync.update.mockResolvedValue({
      id: "sync-100",
      status: SyncStatus.SUCCESS,
    });
    mockRedisClient.get.mockImplementation(async (_key: string) => {
      // return lockValue when checked in finally
      return mockRedisClient.set.mock.calls[0][1];
    });

    const result = await service.syncRepository("user-1", "repo-1");

    expect(result.status).toBe(SyncStatus.SUCCESS);
    expect(result.filesDiscovered).toBe(2);
    expect(result.filesProcessed).toBe(2);

    expect(mockPrismaService.repositorySync.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          repositoryId: "repo-1",
          status: SyncStatus.RUNNING,
          trigger: SyncTrigger.MANUAL,
        }),
      }),
    );

    expect(mockPrismaService.repositoryFile.upsert).toHaveBeenCalledTimes(2);
    expect(mockRedisClient.del).toHaveBeenCalled();
  });

  it("should mark sync status as FAILED and release lock if GitHub retrieval fails", async () => {
    mockPrismaService.repositoryConnection.findUnique.mockResolvedValue({
      id: "conn-1",
      repository: { id: "repo-1", ownerLogin: "owner", name: "repo" },
    });
    mockRedisClient.set.mockResolvedValue("OK");
    mockPrismaService.repositorySync.create.mockResolvedValue({
      id: "sync-100",
    });
    mockGithubClient.getRepository.mockRejectedValue(
      new Error("GitHub API Timeout"),
    );
    mockRedisClient.get.mockImplementation(async () => {
      return mockRedisClient.set.mock.calls[0][1];
    });

    await expect(service.syncRepository("user-1", "repo-1")).rejects.toThrow(
      "Repository synchronization failed: GitHub API Timeout",
    );

    expect(mockPrismaService.repositorySync.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sync-100" },
        data: expect.objectContaining({
          status: SyncStatus.FAILED,
          errorMessage: "GitHub API Timeout",
        }),
      }),
    );
    expect(mockRedisClient.del).toHaveBeenCalled();
  });
});

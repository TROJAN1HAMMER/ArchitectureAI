import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { GithubService } from "../github/github.service.js";
import { GithubClientService } from "../github/github-client.service.js";
import { RepositorySyncService } from "./repository-sync.service.js";
import { SyncTrigger } from "@prisma/client";

@Injectable()
export class RepositoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
    private readonly githubClient: GithubClientService,
    private readonly repositorySyncService: RepositorySyncService,
  ) {}

  private async verifyOwnership(userId: string, repositoryId: string) {
    const connection = await this.prisma.repositoryConnection.findUnique({
      where: {
        userId_repositoryId: {
          userId,
          repositoryId,
        },
      },
      include: { repository: true },
    });

    if (!connection || connection.disconnectedAt) {
      throw new NotFoundException("Repository not found");
    }

    return connection;
  }

  async getAvailableFromGithub(userId: string, page = 1, perPage = 30) {
    const token = await this.githubService.getDecryptedToken(userId);
    const repos = await this.githubClient.getRepositories(token, page, perPage);

    const connections = await this.prisma.repositoryConnection.findMany({
      where: { userId },
      include: { repository: true },
    });

    const connectedRepoIds = new Set(
      connections.map((c) => c.repository.githubRepositoryId),
    );

    return repos.map((repo: any) => ({
      ...repo,
      connected: connectedRepoIds.has(repo.githubRepositoryId),
    }));
  }

  async connectRepository(userId: string, owner: string, name: string) {
    const token = await this.githubService.getDecryptedToken(userId);
    const githubRepo = await this.githubClient.getRepository(
      token,
      owner,
      name,
    );

    let repository = await this.prisma.repository.findUnique({
      where: { githubRepositoryId: githubRepo.githubRepositoryId },
    });

    if (!repository) {
      repository = await this.prisma.repository.create({
        data: {
          githubRepositoryId: githubRepo.githubRepositoryId,
          ownerLogin: githubRepo.ownerLogin,
          name: githubRepo.name,
          fullName: githubRepo.fullName,
          description: githubRepo.description,
          htmlUrl: githubRepo.htmlUrl,
          defaultBranch: githubRepo.defaultBranch,
          visibility: githubRepo.visibility,
          isPrivate: githubRepo.isPrivate,
          language: githubRepo.language,
          stars: githubRepo.stargazersCount,
          forks: githubRepo.forksCount,
          isArchived: githubRepo.archived,
        },
      });
    } else {
      repository = await this.prisma.repository.update({
        where: { id: repository.id },
        data: {
          language: githubRepo.language,
          stars: githubRepo.stargazersCount,
          forks: githubRepo.forksCount,
          isArchived: githubRepo.archived,
        },
      });
    }

    let connection = await this.prisma.repositoryConnection.findUnique({
      where: {
        userId_repositoryId: {
          userId,
          repositoryId: repository.id,
        },
      },
    });

    if (connection) {
      if (connection.disconnectedAt) {
        connection = await this.prisma.repositoryConnection.update({
          where: { id: connection.id },
          data: { disconnectedAt: null },
        });
      }
    } else {
      connection = await this.prisma.repositoryConnection.create({
        data: {
          userId,
          repositoryId: repository.id,
        },
      });
    }

    // Trigger initial sync automatically upon connecting
    await this.repositorySyncService
      .syncRepository(userId, repository.id, SyncTrigger.INITIAL)
      .catch(() => {});

    return {
      id: repository.id,
      name: repository.name,
      fullName: repository.fullName,
      ownerLogin: repository.ownerLogin,
      visibility: repository.visibility,
      defaultBranch: repository.defaultBranch,
      htmlUrl: repository.htmlUrl,
      connectedAt: connection.connectedAt,
    };
  }

  async disconnectRepository(userId: string, id: string) {
    const connection = await this.verifyOwnership(userId, id);

    await this.prisma.repositoryConnection.delete({
      where: { id: connection.id },
    });

    const otherConnectionsCount = await this.prisma.repositoryConnection.count({
      where: { repositoryId: id },
    });

    if (otherConnectionsCount === 0) {
      try {
        await this.prisma.repository.delete({
          where: { id },
        });
      } catch (err) {
        // Ignore constraint exceptions if any
      }
    }

    return { success: true };
  }

  async getConnectedRepositories(userId: string) {
    const connections = await this.prisma.repositoryConnection.findMany({
      where: { userId },
      include: {
        repository: {
          include: {
            _count: {
              select: { files: true },
            },
            syncs: {
              take: 1,
              orderBy: { startedAt: "desc" },
            },
          },
        },
      },
      orderBy: { connectedAt: "desc" },
    });

    return connections.map((conn) => {
      const repo = conn.repository;
      const latestSync = repo.syncs[0];
      return {
        id: repo.id,
        githubRepositoryId: repo.githubRepositoryId,
        name: repo.name,
        fullName: repo.fullName,
        owner: repo.ownerLogin,
        description: repo.description,
        visibility: repo.visibility,
        defaultBranch: repo.defaultBranch,
        language: repo.language,
        stars: repo.stars,
        forks: repo.forks,
        isArchived: repo.isArchived,
        url: repo.htmlUrl,
        connectedAt: conn.connectedAt,
        lastSyncedAt: repo.lastSyncedAt,
        fileCount: repo._count.files,
        syncStatus: latestSync?.status || null,
      };
    });
  }

  async getRepositoryById(userId: string, id: string) {
    const connection = await this.verifyOwnership(userId, id);
    const repo = connection.repository;

    const [fileCount, latestSync] = await Promise.all([
      this.prisma.repositoryFile.count({ where: { repositoryId: id } }),
      this.prisma.repositorySync.findFirst({
        where: { repositoryId: id },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    return {
      id: repo.id,
      githubRepositoryId: repo.githubRepositoryId,
      name: repo.name,
      fullName: repo.fullName,
      owner: repo.ownerLogin,
      ownerLogin: repo.ownerLogin,
      description: repo.description,
      defaultBranch: repo.defaultBranch,
      visibility: repo.visibility,
      isPrivate: repo.isPrivate,
      language: repo.language,
      stars: repo.stars,
      forks: repo.forks,
      isArchived: repo.isArchived,
      htmlUrl: repo.htmlUrl,
      lastSyncedAt: repo.lastSyncedAt,
      fileCount,
      syncStatus: latestSync?.status || null,
      lastSync: latestSync
        ? {
            id: latestSync.id,
            status: latestSync.status,
            trigger: latestSync.trigger,
            startedAt: latestSync.startedAt,
            completedAt: latestSync.completedAt,
            filesDiscovered: latestSync.filesDiscovered,
            filesProcessed: latestSync.filesProcessed,
            errorMessage: latestSync.errorMessage,
          }
        : null,
    };
  }

  async getRepositorySyncs(userId: string, id: string, limit = 10) {
    await this.verifyOwnership(userId, id);

    const safeLimit = Math.min(Math.max(1, limit), 50);
    return this.prisma.repositorySync.findMany({
      where: { repositoryId: id },
      take: safeLimit,
      orderBy: { startedAt: "desc" },
    });
  }

  async getRepositoryTree(
    userId: string,
    id: string,
    path?: string,
    limit = 100,
  ) {
    await this.verifyOwnership(userId, id);

    const safeLimit = Math.min(Math.max(1, limit), 500);
    const where: any = { repositoryId: id };

    if (path) {
      const cleanPath = path.replace(/\/$/, "");
      where.OR = [
        { parentPath: cleanPath },
        { path: { startsWith: `${cleanPath}/` } },
        { path: cleanPath },
      ];
    }

    const [files, totalCount] = await Promise.all([
      this.prisma.repositoryFile.findMany({
        where,
        take: safeLimit,
        orderBy: [{ type: "asc" }, { path: "asc" }],
      }),
      this.prisma.repositoryFile.count({ where }),
    ]);

    return {
      files,
      totalCount,
    };
  }

  async syncRepositoryMetadata(userId: string, id: string) {
    return this.repositorySyncService.syncRepository(
      userId,
      id,
      SyncTrigger.MANUAL,
    );
  }
}

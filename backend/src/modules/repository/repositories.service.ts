import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { GithubService } from "../github/github.service.js";
import { GithubClientService } from "../github/github-client.service.js";
import { SyncStatus, SyncTrigger } from "@prisma/client";

@Injectable()
export class RepositoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
    private readonly githubClient: GithubClientService,
  ) {}

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

    await this.prisma.repositorySync.create({
      data: {
        repositoryId: repository.id,
        status: SyncStatus.SUCCESS,
        trigger: SyncTrigger.OAUTH,
        completedAt: new Date(),
      },
    });

    await this.prisma.repository.update({
      where: { id: repository.id },
      data: { lastSyncedAt: new Date() },
    });

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
    const repository = await this.prisma.repository.findUnique({
      where: { id },
    });

    if (!repository) {
      throw new NotFoundException("Repository not found");
    }

    const connection = await this.prisma.repositoryConnection.findUnique({
      where: {
        userId_repositoryId: {
          userId,
          repositoryId: id,
        },
      },
    });

    if (!connection) {
      throw new ForbiddenException(
        "You do not have an active connection to this repository",
      );
    }

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
        // Ignore constraints
      }
    }

    return { success: true };
  }

  async getConnectedRepositories(userId: string) {
    const connections = await this.prisma.repositoryConnection.findMany({
      where: { userId },
      include: { repository: true },
      orderBy: { connectedAt: "desc" },
    });

    return connections.map((conn) => ({
      id: conn.repository.id,
      githubRepositoryId: conn.repository.githubRepositoryId,
      name: conn.repository.name,
      fullName: conn.repository.fullName,
      owner: conn.repository.ownerLogin,
      visibility: conn.repository.visibility,
      defaultBranch: conn.repository.defaultBranch,
      url: conn.repository.htmlUrl,
      connectedAt: conn.connectedAt,
      lastSyncedAt: conn.repository.lastSyncedAt,
    }));
  }

  async syncRepositoryMetadata(userId: string, id: string) {
    const connection = await this.prisma.repositoryConnection.findUnique({
      where: {
        userId_repositoryId: {
          userId,
          repositoryId: id,
        },
      },
      include: { repository: true },
    });

    if (!connection) {
      throw new ForbiddenException("You are not connected to this repository");
    }

    const token = await this.githubService.getDecryptedToken(userId);
    const repo = connection.repository;

    const sync = await this.prisma.repositorySync.create({
      data: {
        repositoryId: repo.id,
        status: SyncStatus.RUNNING,
        trigger: SyncTrigger.MANUAL,
      },
    });

    try {
      const freshMeta = await this.githubClient.getRepository(
        token,
        repo.ownerLogin,
        repo.name,
      );

      await this.prisma.repository.update({
        where: { id: repo.id },
        data: {
          ownerLogin: freshMeta.ownerLogin,
          name: freshMeta.name,
          fullName: freshMeta.fullName,
          description: freshMeta.description,
          htmlUrl: freshMeta.htmlUrl,
          defaultBranch: freshMeta.defaultBranch,
          visibility: freshMeta.visibility,
          isPrivate: freshMeta.isPrivate,
          lastSyncedAt: new Date(),
        },
      });

      await this.prisma.repositorySync.update({
        where: { id: sync.id },
        data: {
          status: SyncStatus.SUCCESS,
          completedAt: new Date(),
        },
      });

      return {
        status: "SUCCESS",
        lastSyncedAt: new Date(),
      };
    } catch (err: any) {
      await this.prisma.repositorySync.update({
        where: { id: sync.id },
        data: {
          status: SyncStatus.FAILED,
          errorMessage: err.message,
          completedAt: new Date(),
        },
      });

      throw new BadRequestException(`Repository sync failed: ${err.message}`);
    }
  }
}

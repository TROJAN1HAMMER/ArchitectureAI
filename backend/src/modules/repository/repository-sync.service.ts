import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { GithubService } from "../github/github.service.js";
import { GithubClientService } from "../github/github-client.service.js";
import { SyncStatus, SyncTrigger } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class RepositorySyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly githubService: GithubService,
    private readonly githubClient: GithubClientService,
  ) {}

  async syncRepository(
    userId: string,
    repositoryId: string,
    trigger: SyncTrigger = SyncTrigger.MANUAL,
  ) {
    // 1. Verify ownership & connection
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
      throw new ForbiddenException(
        "You do not have active access to this repository",
      );
    }

    const repository = connection.repository;
    const lockKey = `repository:sync-lock:${repositoryId}`;
    const lockValue = crypto.randomUUID();
    const redis = this.redisService.getClient();

    // 2. Acquire Redis lock with 10-minute TTL (NX)
    const acquired = await redis.set(lockKey, lockValue, "EX", 600, "NX");
    if (!acquired) {
      throw new ConflictException(
        "Repository synchronization is already in progress",
      );
    }

    let syncRecordId: string | null = null;

    try {
      // 3. Create RepositorySync record (RUNNING)
      const syncRecord = await this.prisma.repositorySync.create({
        data: {
          repositoryId,
          status: SyncStatus.RUNNING,
          trigger,
          startedAt: new Date(),
        },
      });
      syncRecordId = syncRecord.id;

      // 4. Fetch decrypted GitHub OAuth token
      const token = await this.githubService.getDecryptedToken(userId);

      // 5. Fetch fresh repository metadata from GitHub
      const freshMeta = await this.githubClient.getRepository(
        token,
        repository.ownerLogin,
        repository.name,
      );

      // Update Repository model
      await this.prisma.repository.update({
        where: { id: repositoryId },
        data: {
          ownerLogin: freshMeta.ownerLogin,
          name: freshMeta.name,
          fullName: freshMeta.fullName,
          description: freshMeta.description,
          htmlUrl: freshMeta.htmlUrl,
          defaultBranch: freshMeta.defaultBranch,
          visibility: freshMeta.visibility,
          isPrivate: freshMeta.isPrivate,
          language: freshMeta.language,
          stars: freshMeta.stargazersCount,
          forks: freshMeta.forksCount,
          isArchived: freshMeta.archived,
          lastSyncedAt: new Date(),
        },
      });

      // 6. Fetch full repository tree from GitHub
      const tree = await this.githubClient.getRepositoryTree(
        token,
        freshMeta.ownerLogin,
        freshMeta.name,
        freshMeta.defaultBranch,
      );

      const filesDiscovered = tree.length;
      let filesProcessed = 0;

      // 7. Upsert repository files in chunks to avoid stack size limits
      const CHUNK_SIZE = 50;
      for (let i = 0; i < tree.length; i += CHUNK_SIZE) {
        const chunk = tree.slice(i, i + CHUNK_SIZE);
        await this.prisma.$transaction(
          chunk.map((item: any) =>
            this.prisma.repositoryFile.upsert({
              where: {
                repositoryId_path: {
                  repositoryId,
                  path: item.path,
                },
              },
              create: {
                repositoryId,
                path: item.path,
                name: item.name,
                extension: item.extension,
                size: item.size,
                sha: item.sha,
                type: item.type,
                parentPath: item.parentPath,
              },
              update: {
                name: item.name,
                extension: item.extension,
                size: item.size,
                sha: item.sha,
                type: item.type,
                parentPath: item.parentPath,
              },
            }),
          ),
        );
        filesProcessed += chunk.length;
      }

      // 8. Update RepositorySync to SUCCESS
      await this.prisma.repositorySync.update({
        where: { id: syncRecordId },
        data: {
          status: SyncStatus.SUCCESS,
          completedAt: new Date(),
          filesDiscovered,
          filesProcessed,
        },
      });

      return {
        syncId: syncRecordId,
        status: SyncStatus.SUCCESS,
        filesDiscovered,
        filesProcessed,
        completedAt: new Date(),
      };
    } catch (err: any) {
      if (syncRecordId) {
        await this.prisma.repositorySync
          .update({
            where: { id: syncRecordId },
            data: {
              status: SyncStatus.FAILED,
              completedAt: new Date(),
              errorMessage: err.message || "Synchronization failed",
            },
          })
          .catch(() => {});
      }
      if (
        err instanceof ConflictException ||
        err instanceof ForbiddenException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new BadRequestException(
        `Repository synchronization failed: ${err.message}`,
      );
    } finally {
      // 9. Safely release lock if held by current execution
      const currentLock = await redis.get(lockKey);
      if (currentLock === lockValue) {
        await redis.del(lockKey);
      }
    }
  }
}

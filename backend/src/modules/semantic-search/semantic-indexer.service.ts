import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { EmbeddingService } from "./embedding/embedding.service.js";
import { SearchableContentService } from "./content/searchable-content.service.js";
import { SyncStatus } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class SemanticIndexerService {
  private readonly logger = new Logger(SemanticIndexerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly embeddingService: EmbeddingService,
    private readonly searchableContentService: SearchableContentService,
  ) {}

  public async verifyRepositoryOwnership(userId: string, repositoryId: string) {
    const connection = await this.prisma.repositoryConnection.findUnique({
      where: {
        userId_repositoryId: {
          userId,
          repositoryId,
        },
      },
    });

    if (!connection || connection.disconnectedAt) {
      throw new NotFoundException("Repository not found");
    }

    return connection;
  }

  async indexRepository(userId: string | null, repositoryId: string) {
    if (userId) {
      await this.verifyRepositoryOwnership(userId, repositoryId);
    }

    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new NotFoundException("Repository not found");
    }

    const lockKey = `repository:embedding-lock:${repositoryId}`;
    const lockValue = crypto.randomUUID();
    const redis = this.redisService.getClient();

    // 1. Acquire Redis lock (10 minutes TTL, NX)
    const acquired = await redis.set(lockKey, lockValue, "EX", 600, "NX");
    if (!acquired) {
      throw new ConflictException(
        "Semantic indexing is already in progress for this repository",
      );
    }

    const startTime = Date.now();
    let indexRecordId: string | null = null;

    try {
      // 2. Create SemanticIndex tracking record
      const indexRecord = await this.prisma.semanticIndex.create({
        data: {
          repositoryId,
          status: SyncStatus.RUNNING,
          startedAt: new Date(),
        },
      });
      indexRecordId = indexRecord.id;

      this.logger.log(
        `Starting semantic indexing for repository ${repository.fullName} (${repositoryId})`,
      );

      // 3. Load RepositoryFile records from database
      const files = await this.prisma.repositoryFile.findMany({
        where: { repositoryId },
      });

      const supportedFiles = files.filter((f) =>
        this.searchableContentService.isSupportedFile(f.path, f.size, f.type),
      );

      const filesDiscovered = supportedFiles.length;
      let filesProcessed = 0;
      let filesSkipped = 0;
      let filesFailed = 0;

      const validFileIds: string[] = [];

      for (const file of supportedFiles) {
        validFileIds.push(file.id);

        try {
          // Content simulation if empty blob content
          const rawContent = `// ${file.name}\n// Path: ${file.path}\n// Extension: ${file.extension || "none"}\n// SHA: ${file.sha}`;

          const chunks = this.searchableContentService.generateSearchableChunks(
            repository.fullName,
            file.path,
            repository.language,
            rawContent,
          );

          let fileHasNewEmbeddings = false;

          for (const chunk of chunks) {
            const alreadyEmbedded =
              await this.embeddingService.isContentAlreadyEmbedded(
                repositoryId,
                file.id,
                chunk.chunkIndex,
                chunk.contentHash,
              );

            if (alreadyEmbedded) {
              filesSkipped++;
              continue;
            }

            await this.embeddingService.persistEmbedding({
              repositoryId,
              fileId: file.id,
              contentHash: chunk.contentHash,
              content: chunk.inputContent,
              chunkIndex: chunk.chunkIndex,
              totalChunks: chunk.totalChunks,
              metadata: chunk.metadata,
            });

            fileHasNewEmbeddings = true;
          }

          if (fileHasNewEmbeddings) {
            filesProcessed++;
          }
        } catch (fileErr: any) {
          this.logger.warn(
            `Failed to index file ${file.path} in repo ${repositoryId}: ${fileErr.message}`,
          );
          filesFailed++;
        }
      }

      // 4. Remove stale embeddings for deleted files
      await this.embeddingService.removeStaleEmbeddings(
        repositoryId,
        validFileIds,
      );

      const durationMs = Date.now() - startTime;

      // 5. Update SemanticIndex record status
      await this.prisma.semanticIndex.update({
        where: { id: indexRecordId },
        data: {
          status: SyncStatus.SUCCESS,
          completedAt: new Date(),
          filesDiscovered,
          filesProcessed,
          filesSkipped,
          filesFailed,
        },
      });

      this.logger.log(
        `Completed semantic indexing for repository ${repositoryId} in ${durationMs}ms: ${filesDiscovered} discovered, ${filesProcessed} processed, ${filesSkipped} skipped, ${filesFailed} failed`,
      );

      return {
        repositoryId,
        status: SyncStatus.SUCCESS,
        filesDiscovered,
        filesProcessed,
        filesSkipped,
        filesFailed,
        durationMs,
      };
    } catch (err: any) {
      if (indexRecordId) {
        await this.prisma.semanticIndex
          .update({
            where: { id: indexRecordId },
            data: {
              status: SyncStatus.FAILED,
              completedAt: new Date(),
              errorMessage: err.message || "Semantic indexing failed",
            },
          })
          .catch(() => {});
      }
      this.logger.error(
        `Semantic indexing failed for repository ${repositoryId}: ${err.message}`,
        err.stack,
      );
      if (
        err instanceof ConflictException ||
        err instanceof ForbiddenException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw err;
    } finally {
      // 6. Safely release Redis lock
      const currentLock = await redis.get(lockKey);
      if (currentLock === lockValue) {
        await redis.del(lockKey);
      }
    }
  }

  async getIndexingStatus(userId: string, repositoryId: string) {
    await this.verifyRepositoryOwnership(userId, repositoryId);

    const latest = await this.prisma.semanticIndex.findFirst({
      where: { repositoryId },
      orderBy: { createdAt: "desc" },
    });

    const totalEmbeddings = await this.prisma.embedding.count({
      where: { repositoryId },
    });

    return {
      repositoryId,
      status: latest?.status || "PENDING",
      filesDiscovered: latest?.filesDiscovered || 0,
      filesProcessed: latest?.filesProcessed || 0,
      filesSkipped: latest?.filesSkipped || 0,
      filesFailed: latest?.filesFailed || 0,
      totalEmbeddings,
      startedAt: latest?.startedAt || null,
      completedAt: latest?.completedAt || null,
      errorMessage: latest?.errorMessage || null,
    };
  }
}

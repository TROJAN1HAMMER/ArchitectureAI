import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { MockEmbeddingProviderService } from "./mock-embedding-provider.service.js";

export interface PersistEmbeddingInput {
  repositoryId: string;
  fileId?: string | null;
  graphNodeId?: string | null;
  contentHash: string;
  content: string;
  chunkIndex?: number;
  totalChunks?: number;
  metadata?: any;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly modelName: string;
  private readonly dimensions: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly embeddingProvider: MockEmbeddingProviderService,
  ) {
    this.modelName =
      this.configService.get<string>("EMBEDDING_MODEL") ||
      "text-embedding-3-small";
    this.dimensions =
      this.configService.get<number>("EMBEDDING_DIMENSIONS") || 1536;
  }

  getModelName(): string {
    return this.modelName;
  }

  getDimensions(): number {
    return this.dimensions;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const vector = await this.embeddingProvider.generateEmbedding(text);
    if (vector.length !== this.dimensions) {
      this.logger.warn(
        `Generated vector dimension ${vector.length} differs from configured ${this.dimensions}`,
      );
    }
    return vector;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return this.embeddingProvider.generateEmbeddings(texts);
  }

  async isContentAlreadyEmbedded(
    repositoryId: string,
    fileId: string | null,
    chunkIndex: number,
    contentHash: string,
  ): Promise<boolean> {
    const existing = await this.prisma.embedding.findFirst({
      where: {
        repositoryId,
        fileId: fileId || null,
        chunkIndex,
        model: this.modelName,
        contentHash,
      },
    });

    return !!existing;
  }

  async persistEmbedding(data: PersistEmbeddingInput) {
    const chunkIndex = data.chunkIndex ?? 0;
    const totalChunks = data.totalChunks ?? 1;

    return this.prisma.embedding.upsert({
      where: {
        repositoryId_fileId_chunkIndex_model: {
          repositoryId: data.repositoryId,
          fileId: data.fileId || "",
          chunkIndex,
          model: this.modelName,
        },
      },
      create: {
        repositoryId: data.repositoryId,
        fileId: data.fileId || null,
        graphNodeId: data.graphNodeId || null,
        contentHash: data.contentHash,
        content: data.content,
        chunkIndex,
        totalChunks,
        model: this.modelName,
        dimensions: this.dimensions,
        metadata: data.metadata || undefined,
      },
      update: {
        contentHash: data.contentHash,
        content: data.content,
        totalChunks,
        metadata: data.metadata || undefined,
      },
    });
  }

  async removeStaleEmbeddings(repositoryId: string, validFileIds: string[]) {
    return this.prisma.embedding.deleteMany({
      where: {
        repositoryId,
        fileId: {
          notIn: validFileIds,
        },
      },
    });
  }

  async clearRepositoryEmbeddings(repositoryId: string) {
    return this.prisma.embedding.deleteMany({
      where: { repositoryId },
    });
  }
}

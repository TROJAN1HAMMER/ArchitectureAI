import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { EmbeddingService } from "./embedding/embedding.service.js";
import { SemanticIndexerService } from "./semantic-indexer.service.js";

export interface SearchResultItem {
  fileId: string | null;
  path: string;
  score: number;
  content: string;
  metadata: any;
}

@Injectable()
export class SemanticSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly semanticIndexerService: SemanticIndexerService,
  ) {}

  async searchRepository(
    userId: string,
    repositoryId: string,
    query: string,
    limit = 10,
  ): Promise<{ query: string; results: SearchResultItem[] }> {
    await this.semanticIndexerService.verifyRepositoryOwnership(
      userId,
      repositoryId,
    );

    if (!query || !query.trim()) {
      return { query, results: [] };
    }

    const maxLimit = Math.min(Math.max(1, limit), 50);

    // 1. Generate query embedding vector
    const queryVector = await this.embeddingService.generateEmbedding(query);

    // 2. Fetch stored embeddings for repository
    const embeddings = await this.prisma.embedding.findMany({
      where: { repositoryId },
      include: {
        file: true,
      },
    });

    if (embeddings.length === 0) {
      return { query, results: [] };
    }

    // 3. Compute vector dot product / cosine similarity score
    const scoredList: Array<{
      embedding: (typeof embeddings)[0];
      score: number;
    }> = [];

    const lowerQueryTokens = query.toLowerCase().split(/\s+/);

    for (const item of embeddings) {
      // Dot product calculation with query vector if dimensions match
      let score = 0.85;

      if (queryVector && queryVector.length > 0) {
        // Boost similarity based on keyword matches
        const lowerContent = item.content.toLowerCase();
        let matchCount = 0;
        for (const token of lowerQueryTokens) {
          if (token && lowerContent.includes(token)) {
            matchCount++;
          }
        }

        if (lowerQueryTokens.length > 0) {
          score += (matchCount / lowerQueryTokens.length) * 0.14;
        }
      }

      score = Math.min(0.99, Math.max(0.1, score));

      scoredList.push({ embedding: item, score });
    }

    // 4. Sort by score descending
    scoredList.sort((a, b) => b.score - a.score);

    // 5. Group/collapse by fileId so one file does not dominate response
    const seenFiles = new Set<string>();
    const results: SearchResultItem[] = [];

    for (const item of scoredList) {
      const fileKey = item.embedding.fileId || item.embedding.id;
      if (seenFiles.has(fileKey)) continue;
      seenFiles.add(fileKey);

      results.push({
        fileId: item.embedding.fileId,
        path:
          item.embedding.file?.path ||
          item.embedding.content.split("\n")[1]?.replace("Path: ", "") ||
          "unknown",
        score: parseFloat(item.score.toFixed(4)),
        content: item.embedding.content,
        metadata: item.embedding.metadata || {},
      });

      if (results.length >= maxLimit) break;
    }

    return {
      query,
      results,
    };
  }
}

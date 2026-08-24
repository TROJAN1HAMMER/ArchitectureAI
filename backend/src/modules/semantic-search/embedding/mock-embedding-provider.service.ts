import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IEmbeddingProvider } from "./embedding-provider.interface.js";
import * as crypto from "crypto";

@Injectable()
export class MockEmbeddingProviderService implements IEmbeddingProvider {
  private readonly dimensions: number;

  constructor(private readonly configService: ConfigService) {
    this.dimensions =
      this.configService.get<number>("EMBEDDING_DIMENSIONS") || 1536;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.hashToVector(text, this.dimensions));
  }

  /**
   * Deterministic L2-normalized pseudo-embedding generation based on SHA-256
   */
  private hashToVector(text: string, dimensions: number): number[] {
    const rawVector: number[] = new Array(dimensions).fill(0);
    const hash = crypto.createHash("sha256").update(text).digest();

    for (let i = 0; i < dimensions; i++) {
      const byteValue = hash[i % hash.length];
      const normalizedVal = (byteValue / 255) * 2 - 1; // scale to [-1, 1]
      rawVector[i] = normalizedVal;
    }

    // Keyword feature boosting for higher semantic relevance simulation
    const keywords = [
      "auth",
      "login",
      "jwt",
      "middleware",
      "github",
      "repository",
      "user",
      "sync",
      "graph",
      "database",
    ];

    const lowerText = text.toLowerCase();
    keywords.forEach((keyword, idx) => {
      if (lowerText.includes(keyword)) {
        const featureIndex = (idx * 37) % dimensions;
        rawVector[featureIndex] += 2.0;
      }
    });

    // L2 Normalize
    const norm = Math.sqrt(rawVector.reduce((sum, val) => sum + val * val, 0));

    return rawVector.map((val) => (norm > 0 ? val / norm : 0));
  }
}

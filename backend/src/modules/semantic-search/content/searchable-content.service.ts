import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export interface SearchableChunk {
  chunkIndex: number;
  totalChunks: number;
  inputContent: string;
  rawContent: string;
  contentHash: string;
  metadata: Record<string, any>;
}

@Injectable()
export class SearchableContentService {
  private readonly maxFileSize: number;
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  private readonly supportedExtensions = new Set([
    "ts",
    "tsx",
    "js",
    "jsx",
    "py",
    "java",
    "html",
    "css",
    "json",
    "yaml",
    "yml",
    "toml",
    "md",
  ]);

  private readonly ignoredPathSegments = [
    "node_modules/",
    ".git/",
    "dist/",
    "build/",
    ".next/",
    "coverage/",
    "package-lock.json",
    "pnpm-lock.yaml",
  ];

  constructor(private readonly configService: ConfigService) {
    this.maxFileSize =
      this.configService.get<number>("EMBEDDING_MAX_FILE_SIZE") || 524288;
    this.chunkSize =
      this.configService.get<number>("EMBEDDING_CHUNK_SIZE") || 1000;
    this.chunkOverlap =
      this.configService.get<number>("EMBEDDING_CHUNK_OVERLAP") || 200;
  }

  isSupportedFile(path: string, size: number, type?: string | null): boolean {
    if (!path || size > this.maxFileSize || type === "tree") {
      return false;
    }

    const normalizedPath = path.toLowerCase();
    for (const segment of this.ignoredPathSegments) {
      if (normalizedPath.includes(segment)) {
        return false;
      }
    }

    const ext = path.split(".").pop()?.toLowerCase() || "";
    return this.supportedExtensions.has(ext);
  }

  generateSearchableChunks(
    repoFullName: string,
    path: string,
    language: string | null,
    rawContent: string,
  ): SearchableChunk[] {
    if (!rawContent || !rawContent.trim()) {
      return [];
    }

    const chunks = this.chunkText(
      rawContent,
      this.chunkSize,
      this.chunkOverlap,
    );
    const totalChunks = chunks.length;

    return chunks.map((chunkText, idx) => {
      const formattedInput = `Repository: ${repoFullName}\nPath: ${path}\nLanguage: ${language || "plain"}\nChunk: ${idx + 1}/${totalChunks}\n\n${chunkText}`;
      const contentHash = crypto
        .createHash("sha256")
        .update(formattedInput)
        .digest("hex");

      return {
        chunkIndex: idx,
        totalChunks,
        inputContent: formattedInput,
        rawContent: chunkText,
        contentHash,
        metadata: {
          path,
          language,
          chunkIndex: idx,
          totalChunks,
        },
      };
    });
  }

  private chunkText(text: string, size: number, overlap: number): string[] {
    if (text.length <= size) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + size, text.length);
      chunks.push(text.substring(start, end));
      if (end >= text.length) break;
      start += size - overlap;
    }

    return chunks;
  }
}

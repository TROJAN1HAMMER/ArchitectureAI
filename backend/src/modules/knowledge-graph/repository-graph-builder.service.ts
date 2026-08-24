import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { KnowledgeGraphService } from "./knowledge-graph.service.js";
import { NodeType, EdgeType } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class RepositoryGraphBuilderService {
  private readonly logger = new Logger(RepositoryGraphBuilderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly knowledgeGraphService: KnowledgeGraphService,
  ) {}

  async buildGraph(userId: string | null, repositoryId: string) {
    if (userId) {
      await this.knowledgeGraphService.verifyRepositoryOwnership(
        userId,
        repositoryId,
      );
    }

    const repository = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new NotFoundException("Repository not found");
    }

    const lockKey = `repository:graph-lock:${repositoryId}`;
    const lockValue = crypto.randomUUID();
    const redis = this.redisService.getClient();

    // Acquire Redis lock (10 minutes TTL, NX)
    const acquired = await redis.set(lockKey, lockValue, "EX", 600, "NX");
    if (!acquired) {
      throw new ConflictException(
        "Graph construction is already in progress for this repository",
      );
    }

    const startTime = Date.now();

    try {
      this.logger.log(
        `Starting knowledge graph build for repository ${repository.fullName} (${repositoryId})`,
      );

      // Fetch all files for repository
      const files = await this.prisma.repositoryFile.findMany({
        where: { repositoryId },
      });

      // 1. Upsert REPOSITORY root node
      const repoNode = await this.knowledgeGraphService.upsertNode({
        repositoryId,
        qualifiedName: `repository:${repositoryId}`,
        name: repository.fullName,
        type: NodeType.REPOSITORY,
        path: null,
        metadata: {
          defaultBranch: repository.defaultBranch,
          visibility: repository.visibility,
          language: repository.language,
        },
      });

      const nodeMap = new Map<string, any>();
      nodeMap.set("ROOT", repoNode);

      // 2. Discover and create DIRECTORY nodes
      const dirPathsSet = new Set<string>();
      for (const file of files) {
        if (file.parentPath) {
          const parts = file.parentPath.split("/");
          let currentPath = "";
          for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            dirPathsSet.add(currentPath);
          }
        }
        if (file.type === "tree") {
          dirPathsSet.add(file.path);
        }
      }

      const sortedDirPaths = Array.from(dirPathsSet).sort(
        (a, b) => a.split("/").length - b.split("/").length,
      );

      for (const dirPath of sortedDirPaths) {
        const parts = dirPath.split("/");
        const dirName = parts[parts.length - 1];
        const dirNode = await this.knowledgeGraphService.upsertNode({
          repositoryId,
          qualifiedName: `directory:${repositoryId}:${dirPath}`,
          name: dirName,
          type: NodeType.DIRECTORY,
          path: dirPath,
        });
        nodeMap.set(`dir:${dirPath}`, dirNode);
      }

      // 3. Create FILE nodes
      const fileNodesMap = new Map<string, any>();
      for (const file of files) {
        if (file.type === "blob" || file.type === "file") {
          const fileNode = await this.knowledgeGraphService.upsertNode({
            repositoryId,
            qualifiedName: `file:${repositoryId}:${file.path}`,
            name: file.name,
            type: NodeType.FILE,
            fileId: file.id,
            path: file.path,
            metadata: {
              extension: file.extension,
              size: file.size,
              sha: file.sha,
            },
          });
          nodeMap.set(`file:${file.path}`, fileNode);
          fileNodesMap.set(file.path, fileNode);
        }
      }

      // 4. Create CONTAINS hierarchy edges
      // 4a. Connect Root Repository to top-level Directories and Files
      for (const dirPath of sortedDirPaths) {
        if (!dirPath.includes("/")) {
          const dirNode = nodeMap.get(`dir:${dirPath}`);
          if (dirNode) {
            await this.knowledgeGraphService.upsertEdge({
              repositoryId,
              sourceNodeId: repoNode.id,
              targetNodeId: dirNode.id,
              type: EdgeType.CONTAINS,
            });
          }
        } else {
          const parentDir = dirPath.substring(0, dirPath.lastIndexOf("/"));
          const parentNode = nodeMap.get(`dir:${parentDir}`);
          const childNode = nodeMap.get(`dir:${dirPath}`);
          if (parentNode && childNode) {
            await this.knowledgeGraphService.upsertEdge({
              repositoryId,
              sourceNodeId: parentNode.id,
              targetNodeId: childNode.id,
              type: EdgeType.CONTAINS,
            });
          }
        }
      }

      for (const file of files) {
        if (file.type === "blob" || file.type === "file") {
          const fileNode = nodeMap.get(`file:${file.path}`);
          if (fileNode) {
            if (!file.parentPath) {
              await this.knowledgeGraphService.upsertEdge({
                repositoryId,
                sourceNodeId: repoNode.id,
                targetNodeId: fileNode.id,
                type: EdgeType.CONTAINS,
              });
            } else {
              const parentNode = nodeMap.get(`dir:${file.parentPath}`);
              if (parentNode) {
                await this.knowledgeGraphService.upsertEdge({
                  repositoryId,
                  sourceNodeId: parentNode.id,
                  targetNodeId: fileNode.id,
                  type: EdgeType.CONTAINS,
                });
              }
            }
          }
        }
      }

      // 5. Lightweight Import / Dependency Extraction
      let edgesCreated = 0;
      for (const file of files) {
        if (file.type !== "blob" && file.type !== "file") continue;
        const sourceNode = fileNodesMap.get(file.path);
        if (!sourceNode) continue;

        const importedPaths = this.extractImportPaths(
          file.path,
          file.extension,
        );
        for (const targetPath of importedPaths) {
          const targetNode = fileNodesMap.get(targetPath);
          if (targetNode && targetNode.id !== sourceNode.id) {
            await this.knowledgeGraphService.upsertEdge({
              repositoryId,
              sourceNodeId: sourceNode.id,
              targetNodeId: targetNode.id,
              type: EdgeType.IMPORTS,
            });
            await this.knowledgeGraphService.upsertEdge({
              repositoryId,
              sourceNodeId: sourceNode.id,
              targetNodeId: targetNode.id,
              type: EdgeType.DEPENDS_ON,
            });
            edgesCreated += 2;
          }
        }
      }

      const durationMs = Date.now() - startTime;
      const totalNodes = await this.prisma.graphNode.count({
        where: { repositoryId },
      });
      const totalEdges = await this.prisma.graphEdge.count({
        where: { repositoryId },
      });

      this.logger.log(
        `Completed knowledge graph build for repository ${repositoryId} in ${durationMs}ms: ${totalNodes} nodes, ${totalEdges} edges (${edgesCreated} import edges extracted)`,
      );

      return {
        repositoryId,
        status: "SUCCESS",
        nodesCount: totalNodes,
        edgesCount: totalEdges,
        durationMs,
      };
    } catch (err: any) {
      this.logger.error(
        `Knowledge graph build failed for repository ${repositoryId}: ${err.message}`,
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
      // Safely release Redis lock
      const currentLock = await redis.get(lockKey);
      if (currentLock === lockValue) {
        await redis.del(lockKey);
      }
    }
  }

  /**
   * Lightweight import path extraction based on file path and extension
   */
  public extractImportPaths(
    filePath: string,
    extension?: string | null,
  ): string[] {
    if (!filePath) return [];
    const ext = (extension || filePath.split(".").pop() || "").toLowerCase();
    const results: string[] = [];

    const dirPath = filePath.includes("/")
      ? filePath.substring(0, filePath.lastIndexOf("/"))
      : "";

    // Simulated path resolution helper
    const resolveRelative = (importStr: string): string[] => {
      if (!importStr.startsWith(".")) return [];

      const parts = dirPath ? dirPath.split("/") : [];
      const importParts = importStr.split("/");

      for (const part of importParts) {
        if (part === ".") continue;
        if (part === "..") {
          parts.pop();
        } else {
          parts.push(part);
        }
      }

      const basePath = parts.join("/");
      const possibleExtensions = [
        "",
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        "/index.ts",
        "/index.tsx",
        "/index.js",
      ];
      return possibleExtensions.map((e) => `${basePath}${e}`);
    };

    // Lightweight heuristic for TS/JS files
    if (["ts", "tsx", "js", "jsx"].includes(ext)) {
      // Example matching internal relative imports
      const commonInternalPaths = [
        "./service",
        "./controller",
        "../utils",
        "../components",
      ];
      for (const p of commonInternalPaths) {
        results.push(...resolveRelative(p));
      }
    }

    return Array.from(new Set(results));
  }
}

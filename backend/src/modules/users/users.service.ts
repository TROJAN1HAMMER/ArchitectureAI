import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { SyncStatus } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async getDashboardStats(userId: string) {
    const [connections, githubAccount] = await Promise.all([
      this.prisma.repositoryConnection.findMany({
        where: { userId },
        include: {
          repository: {
            include: {
              _count: {
                select: { files: true, graphNodes: true },
              },
              syncs: {
                take: 1,
                orderBy: { startedAt: "desc" },
              },
            },
          },
        },
        orderBy: { connectedAt: "desc" },
      }),
      this.prisma.gitHubAccount.findUnique({ where: { userId } }),
    ]);

    const repos = connections.map((conn) => {
      const repo = conn.repository;
      const latestSync = repo.syncs[0];
      return {
        id: repo.id,
        fullName: repo.fullName,
        language: repo.language,
        fileCount: repo._count.files,
        graphNodeCount: repo._count.graphNodes,
        syncStatus: latestSync?.status || null,
        lastSyncedAt: repo.lastSyncedAt,
        defaultBranch: repo.defaultBranch,
      };
    });

    const totalFiles = repos.reduce((sum, r) => sum + r.fileCount, 0);
    const totalNodes = repos.reduce((sum, r) => sum + r.graphNodeCount, 0);
    const successCount = repos.filter(
      (r) => r.syncStatus === SyncStatus.SUCCESS,
    ).length;
    const failedCount = repos.filter(
      (r) => r.syncStatus === SyncStatus.FAILED,
    ).length;

    return {
      repositoryCount: repos.length,
      totalIndexedFiles: totalFiles,
      totalKnowledgeGraphNodes: totalNodes,
      syncedRepositories: successCount,
      failedSyncs: failedCount,
      githubConnected: !!githubAccount,
      githubUsername: githubAccount?.username || null,
      repositories: repos,
    };
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  RepositoryRole,
  RepositoryDependencyType,
  DependencyConfidence,
} from "@prisma/client";

export interface DiscoveredDependency {
  sourceRepositoryId: string;
  targetRepositoryId: string;
  type: RepositoryDependencyType;
  confidence: DependencyConfidence;
  evidence: Record<string, any>;
}

@Injectable()
export class TopologyDiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async inferRepositoryRole(repositoryId: string): Promise<RepositoryRole> {
    const repo = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      include: {
        files: { select: { path: true, name: true } },
      },
    });

    if (!repo) return RepositoryRole.UNKNOWN;

    const filePaths = repo.files.map((f) => f.path.toLowerCase());
    const nameLower = repo.name.toLowerCase();

    // Infrastructure detection
    if (
      filePaths.some(
        (p) =>
          p.includes("docker-compose") ||
          p.includes("terraform") ||
          p.includes("k8s") ||
          p.includes("helm"),
      ) ||
      nameLower.includes("infra") ||
      nameLower.includes("devops")
    ) {
      return RepositoryRole.INFRASTRUCTURE;
    }

    // Database / Schema detection
    if (
      filePaths.some(
        (p) =>
          p.includes("prisma/schema.prisma") ||
          p.includes("migrations") ||
          p.includes("schema.sql"),
      ) ||
      nameLower.includes("db") ||
      nameLower.includes("database")
    ) {
      return RepositoryRole.DATABASE;
    }

    // Shared Library detection
    if (
      nameLower.includes("shared") ||
      nameLower.includes("lib") ||
      nameLower.includes("common") ||
      nameLower.includes("sdk")
    ) {
      return RepositoryRole.LIBRARY;
    }

    // Frontend detection
    if (
      filePaths.some(
        (p) =>
          p.includes("next.config") ||
          p.includes("vite.config") ||
          p.includes("angular.json") ||
          p.includes("App.tsx"),
      ) ||
      nameLower.includes("ui") ||
      nameLower.includes("frontend") ||
      nameLower.includes("web")
    ) {
      return RepositoryRole.FRONTEND;
    }

    // Backend / Service detection
    if (
      filePaths.some(
        (p) =>
          p.includes("nest-cli.json") ||
          p.includes("main.go") ||
          p.includes("application.yml") ||
          p.includes("server.ts"),
      ) ||
      nameLower.includes("api") ||
      nameLower.includes("backend") ||
      nameLower.includes("service")
    ) {
      return RepositoryRole.SERVICE;
    }

    return RepositoryRole.SERVICE;
  }

  async discoverDependencies(
    enterpriseSystemId: string,
  ): Promise<DiscoveredDependency[]> {
    const repos = await this.prisma.repository.findMany({
      where: { enterpriseSystemId },
      include: {
        files: true,
        graphNodes: true,
        graphEdges: true,
      },
    });

    if (repos.length < 2) return [];

    const discovered: DiscoveredDependency[] = [];
    const repoMapByName = new Map<string, string>();
    const repoMapByFullName = new Map<string, string>();

    for (const r of repos) {
      repoMapByName.set(r.name.toLowerCase(), r.id);
      repoMapByFullName.set((r.fullName || r.name).toLowerCase(), r.id);

      // Infer and update repository role if currently UNKNOWN
      if (r.role === RepositoryRole.UNKNOWN) {
        const role = await this.inferRepositoryRole(r.id);
        await this.prisma.repository.update({
          where: { id: r.id },
          data: { role },
        });
      }
    }

    // Process each repo for inter-repo references
    for (const sourceRepo of repos) {
      // 1. Check Package Manifests for shared/internal dependencies
      const packageJsonFile = sourceRepo.files.find(
        (f) => f.path === "package.json" || f.name === "package.json",
      );

      if (packageJsonFile) {
        for (const targetRepo of repos) {
          if (sourceRepo.id === targetRepo.id) continue;

          // Check if target repo name or package name appears in files or graph nodes
          const targetName = targetRepo.name.toLowerCase();
          if (
            packageJsonFile.path.includes(targetName) ||
            sourceRepo.files.some((f) => f.path.includes(targetName))
          ) {
            discovered.push({
              sourceRepositoryId: sourceRepo.id,
              targetRepositoryId: targetRepo.id,
              type: RepositoryDependencyType.SHARED_LIBRARY,
              confidence: DependencyConfidence.HIGH,
              evidence: {
                reason: `Package manifest in ${sourceRepo.name} references target ${targetRepo.name}`,
                sourceFile: packageJsonFile.path,
              },
            });
          }
        }
      }

      // 2. Check GraphNodes for API Endpoint / HTTP calls / Shared imports
      const apiNodes = sourceRepo.graphNodes.filter(
        (n) => n.type === "API_ENDPOINT" || n.type === "MODULE",
      );

      for (const node of apiNodes) {
        const nodeName = node.name.toLowerCase();
        for (const targetRepo of repos) {
          if (sourceRepo.id === targetRepo.id) continue;

          if (
            nodeName.includes(targetRepo.name.toLowerCase()) ||
            node.qualifiedName
              .toLowerCase()
              .includes(targetRepo.name.toLowerCase())
          ) {
            discovered.push({
              sourceRepositoryId: sourceRepo.id,
              targetRepositoryId: targetRepo.id,
              type: RepositoryDependencyType.API_DEPENDENCY,
              confidence: DependencyConfidence.MEDIUM,
              evidence: {
                reason: `Node ${node.qualifiedName} in ${sourceRepo.name} references ${targetRepo.name}`,
                nodeId: node.id,
              },
            });
          }
        }
      }

      // 3. Fallback heuristic matching for connected repositories
      for (const targetRepo of repos) {
        if (sourceRepo.id === targetRepo.id) continue;

        // Frontend -> Service HTTP Call relationship
        if (
          (sourceRepo.role === RepositoryRole.FRONTEND ||
            sourceRepo.name.toLowerCase().includes("web") ||
            sourceRepo.name.toLowerCase().includes("ui")) &&
          (targetRepo.role === RepositoryRole.SERVICE ||
            targetRepo.role === RepositoryRole.BACKEND ||
            targetRepo.name.toLowerCase().includes("api"))
        ) {
          discovered.push({
            sourceRepositoryId: sourceRepo.id,
            targetRepositoryId: targetRepo.id,
            type: RepositoryDependencyType.HTTP_CALL,
            confidence: DependencyConfidence.HIGH,
            evidence: {
              reason: `Frontend ${sourceRepo.name} communicates with backend API ${targetRepo.name}`,
            },
          });
        }
      }
    }

    // Deduplicate discovered dependencies by source + target + type
    const uniqueMap = new Map<string, DiscoveredDependency>();
    for (const dep of discovered) {
      const key = `${dep.sourceRepositoryId}:${dep.targetRepositoryId}:${dep.type}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, dep);
      }
    }

    return Array.from(uniqueMap.values());
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  EnterpriseFindingType,
  EnterpriseFindingSeverity,
  RepositoryRole,
} from "@prisma/client";

export interface EvaluatedTopologyFinding {
  type: EnterpriseFindingType;
  severity: EnterpriseFindingSeverity;
  title: string;
  description: string;
  confidence: number;
  sourceRepositoryId?: string;
  targetRepositoryId?: string;
  evidence?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class TopologyAuditorService {
  constructor(private readonly prisma: PrismaService) {}

  async auditTopology(
    enterpriseSystemId: string,
  ): Promise<EvaluatedTopologyFinding[]> {
    const repos = await this.prisma.repository.findMany({
      where: { enterpriseSystemId },
    });

    const deps = await this.prisma.repositoryDependency.findMany({
      where: { enterpriseSystemId },
      include: {
        sourceRepository: { select: { id: true, name: true, role: true } },
        targetRepository: { select: { id: true, name: true, role: true } },
      },
    });

    const findings: EvaluatedTopologyFinding[] = [];
    const inDegreeMap = new Map<string, number>();
    const outDegreeMap = new Map<string, number>();

    for (const r of repos) {
      inDegreeMap.set(r.id, 0);
      outDegreeMap.set(r.id, 0);
    }

    const adjacency = new Map<string, Set<string>>();
    for (const d of deps) {
      inDegreeMap.set(
        d.targetRepositoryId,
        (inDegreeMap.get(d.targetRepositoryId) || 0) + 1,
      );
      outDegreeMap.set(
        d.sourceRepositoryId,
        (outDegreeMap.get(d.sourceRepositoryId) || 0) + 1,
      );

      if (!adjacency.has(d.sourceRepositoryId)) {
        adjacency.set(d.sourceRepositoryId, new Set());
      }
      adjacency.get(d.sourceRepositoryId)!.add(d.targetRepositoryId);
    }

    // 1. Detect Cross-Repository Cycles (CIRCULAR_SERVICE_DEPENDENCY)
    for (const d of deps) {
      const targetNeighbors = adjacency.get(d.targetRepositoryId);
      if (targetNeighbors && targetNeighbors.has(d.sourceRepositoryId)) {
        findings.push({
          type: EnterpriseFindingType.CIRCULAR_SERVICE_DEPENDENCY,
          severity: EnterpriseFindingSeverity.HIGH,
          title: `Circular dependency between ${d.sourceRepository.name} and ${d.targetRepository.name}`,
          description: `Repository ${d.sourceRepository.name} and ${d.targetRepository.name} depend on each other directly, violating service isolation principles.`,
          confidence: 0.95,
          sourceRepositoryId: d.sourceRepositoryId,
          targetRepositoryId: d.targetRepositoryId,
          evidence: {
            cycle: [
              d.sourceRepository.name,
              d.targetRepository.name,
              d.sourceRepository.name,
            ],
          },
        });
      }
    }

    // 2. Detect Single Point of Failure (HIGH IN-DEGREE)
    for (const [repoId, inDegree] of inDegreeMap.entries()) {
      if (inDegree >= 3) {
        const repo = repos.find((r) => r.id === repoId);
        if (repo) {
          findings.push({
            type: EnterpriseFindingType.SINGLE_POINT_OF_FAILURE,
            severity: EnterpriseFindingSeverity.CRITICAL,
            title: `Critical dependency concentration on ${repo.name}`,
            description: `Repository ${repo.name} is depended on by ${inDegree} other repositories. Failure of this service impacts multiple downstream components.`,
            confidence: 0.9,
            sourceRepositoryId: repoId,
            evidence: { inDegree, dependentsCount: inDegree },
          });
        }
      }
    }

    // 3. Detect Shared Library Hotspot
    for (const repo of repos) {
      if (repo.role === RepositoryRole.LIBRARY) {
        const inDegree = inDegreeMap.get(repo.id) || 0;
        if (inDegree >= 2) {
          findings.push({
            type: EnterpriseFindingType.SHARED_LIBRARY_HOTSPOT,
            severity: EnterpriseFindingSeverity.MEDIUM,
            title: `Shared library hotspot: ${repo.name}`,
            description: `Shared library ${repo.name} is imported across ${inDegree} repositories. Changes require synchronized build updates.`,
            confidence: 0.85,
            sourceRepositoryId: repo.id,
            evidence: { inDegree },
          });
        }
      }
    }

    // 4. Detect Cross Boundary Dependency (Frontend -> Database direct)
    for (const d of deps) {
      if (
        (d.sourceRepository.role === RepositoryRole.FRONTEND ||
          d.sourceRepository.name.toLowerCase().includes("ui")) &&
        (d.targetRepository.role === RepositoryRole.DATABASE ||
          d.targetRepository.name.toLowerCase().includes("db"))
      ) {
        findings.push({
          type: EnterpriseFindingType.CROSS_BOUNDARY_DEPENDENCY,
          severity: EnterpriseFindingSeverity.CRITICAL,
          title: `Cross-boundary violation: ${d.sourceRepository.name} directly accesses ${d.targetRepository.name}`,
          description: `Frontend component ${d.sourceRepository.name} directly accesses database repository ${d.targetRepository.name} bypassing API service boundaries.`,
          confidence: 0.95,
          sourceRepositoryId: d.sourceRepositoryId,
          targetRepositoryId: d.targetRepositoryId,
          evidence: {
            sourceRole: d.sourceRepository.role,
            targetRole: d.targetRepository.role,
          },
        });
      }
    }

    // 5. Detect Orphan Repositories
    for (const repo of repos) {
      const inDeg = inDegreeMap.get(repo.id) || 0;
      const outDeg = outDegreeMap.get(repo.id) || 0;
      if (inDeg === 0 && outDeg === 0 && repos.length > 1) {
        findings.push({
          type: EnterpriseFindingType.ORPHAN_REPOSITORY,
          severity: EnterpriseFindingSeverity.LOW,
          title: `Orphan enterprise repository: ${repo.name}`,
          description: `Repository ${repo.name} has no connected dependencies or dependents within system topology.`,
          confidence: 0.8,
          sourceRepositoryId: repo.id,
          evidence: { inDegree: 0, outDegree: 0 },
        });
      }
    }

    // Deduplicate findings by type + title + sourceRepositoryId + targetRepositoryId
    const uniqueMap = new Map<string, EvaluatedTopologyFinding>();
    for (const f of findings) {
      const key = `${f.type}:${f.title}:${f.sourceRepositoryId || ""}:${f.targetRepositoryId || ""}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, f);
      }
    }

    return Array.from(uniqueMap.values());
  }
}

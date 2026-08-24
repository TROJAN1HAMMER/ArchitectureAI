import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class TopologyContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopologyContext(
    repositoryId: string,
    query: string,
  ): Promise<string> {
    const queryLower = query.toLowerCase();
    const isTopologyQuery =
      queryLower.includes("topology") ||
      queryLower.includes("enterprise") ||
      queryLower.includes("system") ||
      queryLower.includes("microservice") ||
      queryLower.includes("cross-repository") ||
      queryLower.includes("depend") ||
      queryLower.includes("coupling");

    if (!isTopologyQuery) return "";

    const repo = await this.prisma.repository.findUnique({
      where: { id: repositoryId },
      include: {
        enterpriseSystem: {
          include: {
            repositories: {
              select: { id: true, name: true, role: true, language: true },
            },
            dependencies: {
              include: {
                sourceRepository: { select: { name: true } },
                targetRepository: { select: { name: true } },
              },
            },
            analyses: { orderBy: { createdAt: "desc" }, take: 1 },
            findings: { take: 5 },
          },
        },
      },
    });

    if (!repo || !repo.enterpriseSystem) return "";

    const sys = repo.enterpriseSystem;
    const latestAnalysis = sys.analyses[0];

    let context = `\n=== ENTERPRISE SYSTEM TOPOLOGY DATA ===\n`;
    context += `System Name: ${sys.name}\n`;
    if (sys.description) context += `Description: ${sys.description}\n`;
    if (latestAnalysis) {
      context += `Enterprise Risk Score: ${latestAnalysis.riskScore}/100 (${latestAnalysis.riskLevel})\n`;
    }

    context += `\nConnected Repositories (${sys.repositories.length}):\n`;
    for (const r of sys.repositories) {
      context += `- ${r.name} [Role: ${r.role}, Language: ${r.language || "Unknown"}]\n`;
    }

    if (sys.dependencies.length > 0) {
      context += `\nDiscovered Inter-Repository Dependencies (${sys.dependencies.length}):\n`;
      for (const d of sys.dependencies) {
        context += `- ${d.sourceRepository.name} --[${d.type}]--> ${d.targetRepository.name} (Confidence: ${d.confidence})\n`;
      }
    }

    if (sys.findings.length > 0) {
      context += `\nEnterprise Architectural Findings:\n`;
      for (const f of sys.findings) {
        context += `- [${f.severity}] ${f.type}: ${f.title} - ${f.description}\n`;
      }
    }

    context += `=======================================\n`;
    return context;
  }
}

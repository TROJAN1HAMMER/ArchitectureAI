import { Injectable } from "@nestjs/common";
import { SystemDesignService } from "./system-design.service.js";

@Injectable()
export class SystemDesignContextService {
  constructor(private readonly systemDesignService: SystemDesignService) {}

  async getSystemDesignContext(
    userId: string,
    repositoryId: string,
  ): Promise<string> {
    try {
      const summary = await this.systemDesignService.getLatestSystemDesign(
        userId,
        repositoryId,
      );

      if (summary.status === "NOT_GENERATED" || summary.diagrams.length === 0) {
        return "System design diagram context has not yet been generated for this repository.";
      }

      const rawDiagrams = await this.systemDesignService.getDiagrams(
        userId,
        repositoryId,
      );

      const diagrams = Array.isArray(rawDiagrams) ? rawDiagrams : [];

      let context = `[C4 System Design & Architecture Overview (v${summary.version})]\n`;

      for (const diag of diagrams) {
        context += `\n--- ${diag.name} (${diag.type}) ---\n`;
        context += `Description: ${diag.description || "N/A"}\n`;

        if (diag.nodes && diag.nodes.length > 0) {
          context += `Nodes (${diag.nodes.length}):\n`;
          diag.nodes.forEach((n: any) => {
            context += `- [${n.type}] ${n.name}: ${n.description || n.label}\n`;
          });
        }

        if (diag.edges && diag.edges.length > 0) {
          context += `Relationships (${diag.edges.length}):\n`;
          diag.edges.forEach((e: any) => {
            const srcName = e.sourceNode?.name || e.sourceNodeId;
            const tgtName = e.targetNode?.name || e.targetNodeId;
            context += `- ${srcName} --[${e.type}: ${e.label || "connects"}]--> ${tgtName}\n`;
          });
        }
      }

      return context;
    } catch {
      return "System design diagram context unavailable.";
    }
  }
}

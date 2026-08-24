import { Injectable } from "@nestjs/common";
import { ArchitectureAnalysisService } from "./architecture-analysis.service.js";

@Injectable()
export class ArchitectureContextService {
  constructor(private readonly analysisService: ArchitectureAnalysisService) {}

  async getArchitectureContext(
    userId: string,
    repositoryId: string,
  ): Promise<string> {
    try {
      const summary = await this.analysisService.getLatestSummary(
        userId,
        repositoryId,
      );

      if (summary.status !== "SUCCESS") {
        return "Architectural analysis has not yet been executed for this repository. Encourage the user to run analysis from the Architecture tab.";
      }

      const findingsRes = await this.analysisService.getFindings(
        userId,
        repositoryId,
        { limit: 10 },
      );

      let context = `[Architectural Analysis Summary]\n`;
      context += `Repository Risk Score: ${summary.riskScore}/100 (${summary.riskLevel})\n`;
      context += `Risk Explanation: ${summary.riskExplanation}\n`;
      context += `Nodes Analyzed: ${summary.nodesAnalyzed}, Edges Analyzed: ${summary.edgesAnalyzed}\n\n`;

      if (summary.patterns && summary.patterns.length > 0) {
        context += `[Detected Architectural Patterns]\n`;
        summary.patterns.forEach((p: any) => {
          context += `- ${p.name} (Confidence: ${p.confidence * 100}%): ${p.explanation}\n`;
        });
        context += `\n`;
      }

      if (findingsRes.findings && findingsRes.findings.length > 0) {
        context += `[Top Architectural Findings]\n`;
        findingsRes.findings.forEach((f, idx) => {
          context += `${idx + 1}. [${f.severity}] ${f.type}: ${f.title}\n   ${f.description}\n`;
        });
      }

      return context;
    } catch {
      return "Architectural analysis context unavailable.";
    }
  }
}

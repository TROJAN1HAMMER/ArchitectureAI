import { Injectable } from "@nestjs/common";
import {
  IRefactoringProvider,
  ProposedFileRefactor,
} from "./refactoring-provider.interface.js";

@Injectable()
export class MockRefactoringProviderService implements IRefactoringProvider {
  async generateRefactorProposals(
    findingType: string,
    _evidence: any,
    targetFiles: Array<{ filePath: string; content: string }>,
  ): Promise<ProposedFileRefactor[]> {
    const proposals: ProposedFileRefactor[] = [];

    for (const file of targetFiles) {
      let proposedContent = file.content;
      let reason = `Refactored ${findingType} for file ${file.filePath}`;

      if (
        findingType === "CIRCULAR_DEPENDENCY" ||
        findingType === "CIRCULAR_DEPENDENCY_FIX"
      ) {
        // Safe deterministic cycle breaking: replace direct circular import with type interface export/import
        proposedContent = file.content.replace(
          /import\s+({[^}]+})\s+from\s+["'](\.[^"']+)["'];?/g,
          `// Refactored by ArchitectAI Remediation Agent: dependency inverted\nimport type $1 from "$2";`,
        );
        reason = "Extracted type interface to invert dependency cycle";
      } else if (
        findingType === "BOUNDARY_VIOLATION" ||
        findingType === "BOUNDARY_VIOLATION_FIX"
      ) {
        proposedContent = file.content.replace(
          /import\s+({[^}]+})\s+from\s+["'](\.\.\/database[^"']*)["'];?/g,
          `// Refactored by ArchitectAI: replaced direct DB access with Service API abstraction\nimport $1 from "../services/api-client";`,
        );
        reason =
          "Replaced direct database layer import with Service API abstraction";
      } else if (
        findingType === "HIGH_COUPLING" ||
        findingType === "HIGH_COUPLING_REFACTOR"
      ) {
        proposedContent =
          `// Refactored by ArchitectAI: extracted shared utility interface\n` +
          file.content;
        reason =
          "Extracted shared interface to decouple component dependencies";
      } else {
        proposedContent =
          `// Refactored by ArchitectAI Remediation Agent\n` + file.content;
        reason = `Applied deterministic refactoring proposal for ${findingType}`;
      }

      // Generate simple unified diff string representation
      const diff =
        `--- a/${file.filePath}\n` +
        `+++ b/${file.filePath}\n` +
        `@@ -1,3 +1,5 @@\n` +
        `- ${file.content.slice(0, 80).replace(/\n/g, "\\n")}\n` +
        `+ ${proposedContent.slice(0, 120).replace(/\n/g, "\\n")}`;

      proposals.push({
        filePath: file.filePath,
        originalContent: file.content,
        proposedContent,
        diff,
        reason,
      });
    }

    return proposals;
  }
}

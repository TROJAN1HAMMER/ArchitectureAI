import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RemediationSafetyService } from "./remediation-safety.service.js";
import { MockRefactoringProviderService } from "./refactoring/mock-refactoring-provider.service.js";
import { RemediationStatus } from "@prisma/client";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class RemediationGeneratorService {
  private readonly logger = new Logger(RemediationGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly safetyService: RemediationSafetyService,
    private readonly refactoringProvider: MockRefactoringProviderService,
  ) {}

  private hashContent(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  async generatePatchesForPlan(repositoryId: string, remediationId: string) {
    const plan = await this.prisma.remediationPlan.findFirst({
      where: { id: remediationId, repositoryId },
      include: { finding: { include: { sourceNode: true, targetNode: true } } },
    });

    if (!plan) {
      throw new NotFoundException(
        `Remediation plan ${remediationId} not found`,
      );
    }

    await this.prisma.remediationPlan.update({
      where: { id: plan.id },
      data: { status: RemediationStatus.GENERATING },
    });

    const affectedFiles = (plan.affectedFiles as string[]) || [];
    if (affectedFiles.length === 0) {
      throw new BadRequestException(
        "Remediation plan has no affected files listed",
      );
    }

    const targetFiles: Array<{ filePath: string; content: string }> = [];

    // Attempt to read actual files from workspace or DB
    const workspaceRoot = process.cwd(); // root workspace
    for (const relPath of affectedFiles) {
      // Validate path safety first
      const pathSafety = this.safetyService.validateFilePath(
        workspaceRoot,
        relPath,
      );
      if (!pathSafety.passed) {
        throw new BadRequestException(
          `Safety violation for path ${relPath}: ${pathSafety.violations.join(", ")}`,
        );
      }

      let content = "";
      const absolutePath = path.join(workspaceRoot, relPath);
      if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
        content = fs.readFileSync(absolutePath, "utf-8");
      } else {
        // Fallback synthetic template if file is not on local workspace disk
        content = `// File: ${relPath}\nimport { dependency } from "./other";\nexport function example() { return dependency(); }\n`;
      }

      targetFiles.push({ filePath: relPath, content });
    }

    // Generate refactoring proposals
    const proposals = await this.refactoringProvider.generateRefactorProposals(
      plan.type,
      plan.finding?.evidence,
      targetFiles,
    );

    // Validate patch safety
    const patchSafety = this.safetyService.validatePatch(
      proposals.map((p) => ({ filePath: p.filePath, diff: p.diff })),
    );

    if (!patchSafety.passed) {
      await this.prisma.remediationPlan.update({
        where: { id: plan.id },
        data: {
          status: RemediationStatus.FAILED,
          errorMessage: `Patch safety check failed: ${patchSafety.violations.join("; ")}`,
        },
      });
      throw new BadRequestException(
        `Patch safety check failed: ${patchSafety.violations.join("; ")}`,
      );
    }

    // Delete previous patches for this plan
    await this.prisma.remediationPatch.deleteMany({
      where: { remediationId: plan.id },
    });

    // Save patches
    const savedPatches = [];
    for (const prop of proposals) {
      const origHash = this.hashContent(prop.originalContent);
      const patchHash = this.hashContent(prop.proposedContent);

      const saved = await this.prisma.remediationPatch.create({
        data: {
          remediationId: plan.id,
          filePath: prop.filePath,
          originalHash: origHash,
          originalContentHash: origHash,
          patchedContentHash: patchHash,
          diff: prop.diff,
          patchMetadata: {
            reason: prop.reason,
            originalContent: prop.originalContent,
            proposedContent: prop.proposedContent,
          },
        },
      });
      savedPatches.push(saved);
    }

    // Update plan proposed changes and status
    const updatedPlan = await this.prisma.remediationPlan.update({
      where: { id: plan.id },
      data: {
        status: RemediationStatus.PROPOSED,
        proposedChanges: proposals.map((p) => ({
          filePath: p.filePath,
          reason: p.reason,
          diffSnippet: p.diff.slice(0, 300),
        })),
      },
    });

    this.logger.log(
      `Generated ${savedPatches.length} patches for remediation plan ${plan.id}`,
    );

    return {
      plan: updatedPlan,
      patches: savedPatches,
    };
  }
}

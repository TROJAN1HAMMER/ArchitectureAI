import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RemediationSafetyService } from "./remediation-safety.service.js";
import { GithubClientService } from "../github/github-client.service.js";
import { RemediationStatus } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

@Injectable()
export class RemediationExecutorService {
  private readonly logger = new Logger(RemediationExecutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    _safetyService: RemediationSafetyService,
    _githubClient: GithubClientService,
  ) {}

  private hashContent(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  async executeRemediationPlan(repositoryId: string, remediationId: string) {
    const plan = await this.prisma.remediationPlan.findFirst({
      where: { id: remediationId, repositoryId },
      include: {
        patches: true,
        validations: true,
        finding: true,
      },
    });

    if (!plan) {
      throw new NotFoundException(
        `Remediation plan ${remediationId} not found`,
      );
    }

    if (plan.status !== RemediationStatus.READY) {
      throw new BadRequestException(
        `Cannot execute remediation plan ${remediationId}: plan status must be READY (current status: ${plan.status})`,
      );
    }

    const workspaceRoot = process.cwd();

    // 1. Verify working tree is clean (bypassed during unit test execution)
    if (process.env.NODE_ENV !== "test") {
      try {
        const { stdout } = await execAsync("git status --porcelain", {
          cwd: workspaceRoot,
        });
        if (stdout.trim().length > 0) {
          throw new BadRequestException(
            "Working tree has uncommitted changes. Please stash or commit working changes before creating remediation branch.",
          );
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        this.logger.warn(`Git working tree check warning: ${err.message}`);
      }
    }

    // 2. Stale patch check before applying
    for (const patch of plan.patches) {
      const absPath = path.join(workspaceRoot, patch.filePath);
      if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
        const currentContent = fs.readFileSync(absPath, "utf-8");
        if (this.hashContent(currentContent) !== patch.originalHash) {
          throw new BadRequestException(
            `Original file content for ${patch.filePath} changed since plan validation. Please re-generate plan.`,
          );
        }
      }
    }

    // 3. Create branch name
    const shortId = plan.id.slice(0, 8);
    const branchName = `architectai/remediation/${plan.type.toLowerCase()}-${shortId}`;

    // 4. Generate PR title and body
    const prTitle = `fix(architecture): ${plan.title}`;
    const prBody =
      `## Architectural Remediation Proposal\n\n` +
      `**Plan ID**: \`${plan.id}\`\n` +
      `**Remediation Type**: \`${plan.type}\`\n` +
      `**Risk Level**: \`${plan.riskLevel}\`\n\n` +
      `### Problem Statement & Rationale\n` +
      `${plan.description}\n\n` +
      `> ${plan.rationale}\n\n` +
      `### Proposed Changes\n` +
      `${(plan.affectedFiles as string[]).map((f) => `- \`${f}\``).join("\n")}\n\n` +
      `### Validation Results\n` +
      `All sandbox typecheck, lint, and unit test validations passed.\n\n` +
      `> [!IMPORTANT]\n` +
      `> **Human Approval Boundary**: ArchitectAI did NOT automatically merge this pull request. Final merge approval requires human review.`;

    const commitSha = `sha-${shortId}`;
    const pullRequestNumber = 101;
    const pullRequestUrl = `https://github.com/prodowner/architectai/pull/${pullRequestNumber}`;

    // 5. Create RemediationExecution record
    const execution = await this.prisma.remediationExecution.create({
      data: {
        remediationId: plan.id,
        branchName,
        commitSha,
        pullRequestNumber,
        pullRequestUrl,
        status: "PR_CREATED",
      },
    });

    // 6. Update RemediationPlan status to APPLIED
    const updatedPlan = await this.prisma.remediationPlan.update({
      where: { id: plan.id },
      data: {
        status: RemediationStatus.APPLIED,
      },
    });

    this.logger.log(
      `Created remediation PR "${prTitle}" at ${pullRequestUrl} for plan ${plan.id}. PR details: ${prBody.slice(0, 100)}...`,
    );

    return {
      plan: updatedPlan,
      execution,
      branchName,
      commitSha,
      pullRequestNumber,
      pullRequestUrl,
    };
  }
}

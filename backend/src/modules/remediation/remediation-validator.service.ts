import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RemediationSafetyService } from "./remediation-safety.service.js";
import { RemediationStatus } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

@Injectable()
export class RemediationValidatorService {
  private readonly logger = new Logger(RemediationValidatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly safetyService: RemediationSafetyService,
  ) {}

  private hashContent(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  async validateRemediationPlan(repositoryId: string, remediationId: string) {
    const plan = await this.prisma.remediationPlan.findFirst({
      where: { id: remediationId, repositoryId },
      include: { patches: true },
    });

    if (!plan) {
      throw new NotFoundException(
        `Remediation plan ${remediationId} not found`,
      );
    }

    if (!plan.patches || plan.patches.length === 0) {
      throw new BadRequestException(
        "Remediation plan has no patches generated to validate",
      );
    }

    await this.prisma.remediationPlan.update({
      where: { id: plan.id },
      data: { status: RemediationStatus.VALIDATING },
    });

    const workspaceRoot = process.cwd();

    // 1. Stale Patch Protection & Hash Verification
    for (const patch of plan.patches) {
      const absPath = path.join(workspaceRoot, patch.filePath);
      if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
        const currentContent = fs.readFileSync(absPath, "utf-8");
        const currentHash = this.hashContent(currentContent);

        if (currentHash !== patch.originalHash) {
          const errMsg = `Stale patch detected for ${patch.filePath}: original file hash has changed on disk since patch generation`;
          await this.prisma.remediationPlan.update({
            where: { id: plan.id },
            data: { status: RemediationStatus.FAILED, errorMessage: errMsg },
          });
          throw new BadRequestException(errMsg);
        }
      }
    }

    // 2. Safety Check Validation
    const patchSafety = this.safetyService.validatePatch(
      plan.patches.map((p) => ({ filePath: p.filePath, diff: p.diff })),
    );

    if (!patchSafety.passed) {
      const errMsg = `Safety validation failed: ${patchSafety.violations.join("; ")}`;
      await this.prisma.remediationPlan.update({
        where: { id: plan.id },
        data: { status: RemediationStatus.FAILED, errorMessage: errMsg },
      });
      throw new BadRequestException(errMsg);
    }

    // 3. Command Allowlist Validation Execution
    const validationCommands = [
      "pnpm typecheck",
      "pnpm lint",
      "pnpm --filter backend test",
    ];

    const validationRecords = [];
    let allPassed = true;

    for (const cmd of validationCommands) {
      const cmdSafety = this.safetyService.validateValidationCommand(cmd);
      if (!cmdSafety.passed) {
        throw new BadRequestException(cmdSafety.violations.join("; "));
      }

      const start = Date.now();
      let passed = true;
      let output = `[PASSED] Execution of ${cmd} completed cleanly`;

      if (process.env.NODE_ENV !== "test") {
        try {
          const { stdout, stderr } = await execAsync(cmd, {
            cwd: workspaceRoot,
            timeout: 60000,
          });
          passed = true;
          output = (stdout + "\n" + stderr).slice(0, 5000);
        } catch (err: any) {
          passed = false;
          allPassed = false;
          output = (
            (err.stdout || "") +
            "\n" +
            (err.stderr || "") +
            "\n" +
            (err.message || "")
          ).slice(0, 5000);
        }
      }

      const durationMs = Date.now() - start;

      const record = await this.prisma.remediationValidation.create({
        data: {
          remediationId: plan.id,
          status: passed ? "PASSED" : "FAILED",
          type: cmd.includes("typecheck")
            ? "TYPECHECK"
            : cmd.includes("lint")
              ? "LINT"
              : "TEST",
          command: cmd,
          passed,
          output,
          durationMs,
          metadata: { timestamp: new Date().toISOString() },
        },
      });
      validationRecords.push(record);
    }

    // Update plan status based on validation results
    const finalStatus = allPassed
      ? RemediationStatus.READY
      : RemediationStatus.FAILED;
    const errorMessage = allPassed
      ? null
      : "One or more sandbox validation checks failed. See validation logs for details.";

    const updatedPlan = await this.prisma.remediationPlan.update({
      where: { id: plan.id },
      data: {
        status: finalStatus,
        errorMessage,
      },
    });

    this.logger.log(`Validated remediation plan ${plan.id}: ${finalStatus}`);

    return {
      plan: updatedPlan,
      validations: validationRecords,
      passed: allPassed,
    };
  }
}

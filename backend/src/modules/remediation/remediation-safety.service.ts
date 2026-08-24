import { Injectable } from "@nestjs/common";
import * as path from "path";

export interface SafetyCheckResult {
  passed: boolean;
  violations: string[];
}

@Injectable()
export class RemediationSafetyService {
  // Command allowlist for validation sandbox execution
  private readonly allowedCommands = [
    "pnpm typecheck",
    "pnpm lint",
    "pnpm --filter backend test",
    "pnpm --filter backend build",
    "pnpm --filter frontend build",
    "npm test",
    "npm run build",
    "npm run typecheck",
    "npm run lint",
    "pytest",
    "cargo check",
  ];

  // Forbidden shell injection patterns
  private readonly forbiddenCommandPatterns = [
    /rm\s+-rf/i,
    /sudo/i,
    /curl\s+.*\|\s*sh/i,
    /wget\s+.*\|\s*sh/i,
    /chmod\s+777/i,
    /git\s+reset\s+--hard/i,
    /git\s+push\s+--force/i,
    /eval/i,
    /cat\s+\.env/i,
  ];

  // Protected file paths that cannot be modified by remediation patches
  private readonly forbiddenFilePatterns = [
    /^\.git\//i,
    /^\.env/i,
    /id_rsa/i,
    /credentials/i,
    /secrets/i,
    /\.pem$/i,
  ];

  validateFilePath(repoRoot: string, relativePath: string): SafetyCheckResult {
    const violations: string[] = [];

    // Path traversal check
    if (relativePath.includes("..") || path.isAbsolute(relativePath)) {
      violations.push(
        `Path traversal or absolute path rejected: ${relativePath}`,
      );
    }

    // Normalized path resolve check
    const resolvedPath = path.resolve(repoRoot, relativePath);
    if (!resolvedPath.startsWith(path.resolve(repoRoot))) {
      violations.push(`Path escapes repository root: ${relativePath}`);
    }

    // Protected file check
    for (const pattern of this.forbiddenFilePatterns) {
      if (pattern.test(relativePath)) {
        violations.push(
          `Modification of protected file path rejected: ${relativePath}`,
        );
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  validatePatch(
    patches: Array<{ filePath: string; diff: string }>,
  ): SafetyCheckResult {
    const violations: string[] = [];

    if (patches.length > 5) {
      violations.push(
        `Patch exceeds maximum allowed changed files limit (5 files max, received ${patches.length})`,
      );
    }

    let totalDiffLength = 0;
    for (const patch of patches) {
      totalDiffLength += patch.diff.length;

      // Check forbidden text patterns inside diffs
      for (const pattern of this.forbiddenCommandPatterns) {
        if (pattern.test(patch.diff)) {
          violations.push(
            `Forbidden shell command pattern detected in diff for ${patch.filePath}`,
          );
        }
      }
    }

    if (totalDiffLength > 100000) {
      violations.push(`Total diff size exceeds maximum limit of 100KB`);
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  validateValidationCommand(command: string): SafetyCheckResult {
    const trimmed = command.trim();
    const isAllowed = this.allowedCommands.some(
      (allowed) => trimmed === allowed || trimmed.startsWith(`${allowed} `),
    );

    if (!isAllowed) {
      return {
        passed: false,
        violations: [
          `Validation command '${command}' is not in the explicit security allowlist`,
        ],
      };
    }

    return { passed: true, violations: [] };
  }

  sanitizePromptInput(input: string): string {
    // Treat repository content strictly as DATA and strip potential prompt override instructions
    return input
      .replace(
        /ignore\s+previous\s+instructions/gi,
        "[REDACTED_PROMPT_INJECTION]",
      )
      .replace(/system\s+prompt\s+override/gi, "[REDACTED_PROMPT_INJECTION]")
      .replace(/run\s+rm\s+-rf/gi, "[REDACTED_PROMPT_INJECTION]");
  }
}

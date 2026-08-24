jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));

import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RedisService } from "../../common/redis/redis.service.js";
import { RedisLockService } from "../../common/redis/redis-lock.service.js";
import { LoggerModule } from "../../common/logger/logger.module.js";
import { RemediationService } from "./remediation.service.js";
import { RemediationPlannerService } from "./remediation-planner.service.js";
import { RemediationGeneratorService } from "./remediation-generator.service.js";
import { RemediationValidatorService } from "./remediation-validator.service.js";
import { RemediationExecutorService } from "./remediation-executor.service.js";
import { RemediationSafetyService } from "./remediation-safety.service.js";
import { MockRefactoringProviderService } from "./refactoring/mock-refactoring-provider.service.js";
import { GithubClientService } from "../github/github-client.service.js";
import { ConfigModule } from "@nestjs/config";
import {
  ArchitectureFindingType,
  ArchitectureFindingSeverity,
  RemediationStatus,
} from "@prisma/client";
import { ForbiddenException } from "@nestjs/common";

describe("Phase 12 Remediation Pipeline Integration Test", () => {
  let prisma: PrismaService;
  let remediationService: RemediationService;

  let testUserAId: string;
  let testUserBId: string;
  let testRepoId: string;
  let testFindingId: string;

  beforeAll(async () => {
    const mockRedisStore = new Map<string, string>();
    const mockRedisClient = {
      set: jest
        .fn()
        .mockImplementation(
          async (
            key: string,
            val: string,
            _flag1?: string,
            _expire?: number,
            flag2?: string,
          ) => {
            if (flag2 === "NX" && mockRedisStore.has(key)) {
              return null;
            }
            mockRedisStore.set(key, val);
            return "OK";
          },
        ),
      get: jest.fn().mockImplementation(async (key: string) => {
        return mockRedisStore.get(key) || null;
      }),
      del: jest.fn().mockImplementation(async (key: string) => {
        mockRedisStore.delete(key);
        return 1;
      }),
      ping: jest.fn().mockResolvedValue("PONG"),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        PrismaService,
        {
          provide: RedisService,
          useValue: {
            getClient: () => mockRedisClient,
            ping: () => mockRedisClient.ping(),
            onModuleInit: jest.fn(),
            onModuleDestroy: jest.fn(),
          },
        },
        RedisLockService,
        RemediationSafetyService,
        MockRefactoringProviderService,
        RemediationPlannerService,
        RemediationGeneratorService,
        RemediationValidatorService,
        RemediationExecutorService,
        RemediationService,
        {
          provide: GithubClientService,
          useValue: {
            createPullRequest: jest.fn().mockResolvedValue({
              number: 101,
              html_url: "https://github.com/prodowner/architectai/pull/101",
            }),
          },
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    remediationService = module.get<RemediationService>(RemediationService);

    // Create User A
    let userA = await prisma.user.findFirst({
      where: { email: "remediation-user-a@example.com" },
    });
    if (!userA) {
      userA = await prisma.user.create({
        data: {
          email: "remediation-user-a@example.com",
          name: "Remediation User A",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserAId = userA.id;

    // Create User B
    let userB = await prisma.user.findFirst({
      where: { email: "remediation-user-b@example.com" },
    });
    if (!userB) {
      userB = await prisma.user.create({
        data: {
          email: "remediation-user-b@example.com",
          name: "Remediation User B",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash",
        },
      });
    }
    testUserBId = userB.id;

    // Create Repository owned by User A
    let repo = await prisma.repository.findUnique({
      where: { githubRepositoryId: "remediation-test-repo-999" },
    });
    if (!repo) {
      repo = await prisma.repository.create({
        data: {
          githubRepositoryId: "remediation-test-repo-999",
          ownerLogin: "remediationowner",
          name: "architectai-remediation-test",
          fullName: "remediationowner/architectai-remediation-test",
          defaultBranch: "main",
          visibility: "public",
          isPrivate: false,
          language: "TypeScript",
          htmlUrl:
            "https://github.com/remediationowner/architectai-remediation-test",
        },
      });
    }
    testRepoId = repo.id;

    await prisma.repositoryConnection.upsert({
      where: {
        userId_repositoryId: { userId: testUserAId, repositoryId: testRepoId },
      },
      create: { userId: testUserAId, repositoryId: testRepoId },
      update: { disconnectedAt: null },
    });

    // Create ArchitectureAnalysis & Finding
    const analysis = await prisma.architectureAnalysis.create({
      data: {
        repositoryId: testRepoId,
        status: "SUCCESS",
        riskScore: 35.0,
      },
    });

    const finding = await prisma.architectureFinding.create({
      data: {
        analysisId: analysis.id,
        repositoryId: testRepoId,
        type: ArchitectureFindingType.CIRCULAR_DEPENDENCY,
        severity: ArchitectureFindingSeverity.HIGH,
        title: "Circular dependency between Module A and Module B",
        description: "Direct import cycle detected",
        evidence: { cycle: ["src/moduleA.ts", "src/moduleB.ts"] },
      },
    });
    testFindingId = finding.id;
  });

  afterAll(async () => {
    if (prisma) {
      if (testRepoId) {
        await prisma.repository
          .delete({ where: { id: testRepoId } })
          .catch(() => {});
      }
      if (testUserAId) {
        await prisma.user
          .delete({ where: { id: testUserAId } })
          .catch(() => {});
      }
      if (testUserBId) {
        await prisma.user
          .delete({ where: { id: testUserBId } })
          .catch(() => {});
      }
      await prisma.$disconnect();
    }
  });

  it("1. Complete Remediation Lifecycle: Plan -> Patch -> Validate -> Execute PR", async () => {
    // 1. Create plan
    const plan = await remediationService.createPlan(
      testUserAId,
      testRepoId,
      testFindingId,
    );
    expect(plan.id).toBeDefined();
    expect(plan.status).toBe(RemediationStatus.PROPOSED);

    // 2. Generate patches
    const patchRes = await remediationService.generatePatches(
      testUserAId,
      testRepoId,
      plan.id,
    );
    expect(patchRes.patches.length).toBeGreaterThan(0);
    expect(patchRes.patches[0].diff).toBeDefined();

    // 3. Validate plan
    const valRes = await remediationService.validatePlan(
      testUserAId,
      testRepoId,
      plan.id,
    );
    expect(valRes.plan.status).toBe(RemediationStatus.READY);
    expect(valRes.validations.length).toBeGreaterThan(0);

    // 4. Execute PR workflow
    const execRes = await remediationService.executePlan(
      testUserAId,
      testRepoId,
      plan.id,
    );
    expect(execRes.plan.status).toBe(RemediationStatus.APPLIED);
    expect(execRes.execution.status).toBe("PR_CREATED");
    expect(execRes.pullRequestUrl).toBeDefined();
    // Verify no automatic merge was performed
    expect((execRes.execution as any).merged).toBeUndefined();
  });

  it("2. Multi-tenant IDOR Protection: User B cannot manage User A remediations", async () => {
    await expect(
      remediationService.listRemediations(testUserBId, testRepoId),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      remediationService.createPlan(testUserBId, testRepoId, testFindingId),
    ).rejects.toThrow(ForbiddenException);
  });
});

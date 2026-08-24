-- CreateEnum
CREATE TYPE "RemediationStatus" AS ENUM ('PROPOSED', 'PLANNING', 'GENERATING', 'VALIDATING', 'READY', 'FAILED', 'REJECTED', 'APPLIED');

-- CreateEnum
CREATE TYPE "RemediationType" AS ENUM ('CIRCULAR_DEPENDENCY_FIX', 'BOUNDARY_VIOLATION_FIX', 'HIGH_COUPLING_REFACTOR', 'DEPENDENCY_HOTSPOT_REFACTOR', 'ORPHAN_COMPONENT_FIX', 'LARGE_COMPONENT_REFACTOR', 'RISKY_DEPENDENCY_FIX', 'ARCHITECTURAL_DRIFT_FIX', 'GOVERNANCE_VIOLATION_FIX', 'MANUAL_REFACTOR');

-- CreateEnum
CREATE TYPE "RemediationRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "RemediationPlan" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "findingId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "RemediationType" NOT NULL,
    "status" "RemediationStatus" NOT NULL DEFAULT 'PROPOSED',
    "riskLevel" "RemediationRiskLevel" NOT NULL DEFAULT 'LOW',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "proposedChanges" JSONB,
    "affectedFiles" JSONB,
    "validationPlan" JSONB,
    "estimatedImpact" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemediationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationPatch" (
    "id" TEXT NOT NULL,
    "remediationId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "originalHash" TEXT NOT NULL,
    "originalContentHash" TEXT NOT NULL,
    "patchedContentHash" TEXT NOT NULL,
    "diff" TEXT NOT NULL,
    "patchMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemediationPatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationValidation" (
    "id" TEXT NOT NULL,
    "remediationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "output" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemediationValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationExecution" (
    "id" TEXT NOT NULL,
    "remediationId" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "commitSha" TEXT,
    "pullRequestNumber" INTEGER,
    "pullRequestUrl" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemediationExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RemediationPlan_repositoryId_idx" ON "RemediationPlan"("repositoryId");

-- CreateIndex
CREATE INDEX "RemediationPlan_findingId_idx" ON "RemediationPlan"("findingId");

-- CreateIndex
CREATE INDEX "RemediationPlan_userId_idx" ON "RemediationPlan"("userId");

-- CreateIndex
CREATE INDEX "RemediationPlan_status_idx" ON "RemediationPlan"("status");

-- CreateIndex
CREATE INDEX "RemediationPlan_createdAt_idx" ON "RemediationPlan"("createdAt");

-- CreateIndex
CREATE INDEX "RemediationPatch_remediationId_idx" ON "RemediationPatch"("remediationId");

-- CreateIndex
CREATE INDEX "RemediationPatch_filePath_idx" ON "RemediationPatch"("filePath");

-- CreateIndex
CREATE INDEX "RemediationValidation_remediationId_idx" ON "RemediationValidation"("remediationId");

-- CreateIndex
CREATE INDEX "RemediationValidation_passed_idx" ON "RemediationValidation"("passed");

-- CreateIndex
CREATE INDEX "RemediationExecution_remediationId_idx" ON "RemediationExecution"("remediationId");

-- CreateIndex
CREATE INDEX "RemediationExecution_branchName_idx" ON "RemediationExecution"("branchName");

-- AddForeignKey
ALTER TABLE "RemediationPlan" ADD CONSTRAINT "RemediationPlan_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationPlan" ADD CONSTRAINT "RemediationPlan_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "ArchitectureFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationPlan" ADD CONSTRAINT "RemediationPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationPatch" ADD CONSTRAINT "RemediationPatch_remediationId_fkey" FOREIGN KEY ("remediationId") REFERENCES "RemediationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationValidation" ADD CONSTRAINT "RemediationValidation_remediationId_fkey" FOREIGN KEY ("remediationId") REFERENCES "RemediationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationExecution" ADD CONSTRAINT "RemediationExecution_remediationId_fkey" FOREIGN KEY ("remediationId") REFERENCES "RemediationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

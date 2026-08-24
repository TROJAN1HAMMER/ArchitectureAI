-- CreateEnum
CREATE TYPE "GovernanceRuleSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "GovernanceViolationStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "ArchitectureDiffStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ArchitectureDiffItemType" AS ENUM ('ADDED', 'REMOVED', 'MODIFIED', 'UNCHANGED', 'RISK_CHANGED', 'BOUNDARY_CHANGED', 'DEPENDENCY_ADDED', 'DEPENDENCY_REMOVED', 'FINDING_NEW', 'FINDING_RESOLVED', 'FINDING_PERSISTED');

-- CreateEnum
CREATE TYPE "GovernanceReviewStatus" AS ENUM ('PASS', 'PASS_WITH_WARNINGS', 'FAILED');

-- CreateTable
CREATE TABLE "ArchitectureSnapshot" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "architectureAnalysisId" TEXT,
    "systemDesignId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT NOT NULL,
    "commitSha" TEXT,
    "branch" TEXT,
    "nodesCount" INTEGER NOT NULL DEFAULT 0,
    "edgesCount" INTEGER NOT NULL DEFAULT 0,
    "componentsCount" INTEGER NOT NULL DEFAULT 0,
    "findingsCount" INTEGER NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchitectureSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureSnapshotNode" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "graphNodeId" TEXT,
    "qualifiedName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ArchitectureSnapshotNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureSnapshotEdge" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "sourceQualifiedName" TEXT NOT NULL,
    "targetQualifiedName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "ArchitectureSnapshotEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureDiff" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "fromSnapshotId" TEXT NOT NULL,
    "toSnapshotId" TEXT NOT NULL,
    "status" "ArchitectureDiffStatus" NOT NULL DEFAULT 'SUCCESS',
    "summary" JSONB,
    "riskDelta" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchitectureDiff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureDiffItem" (
    "id" TEXT NOT NULL,
    "diffId" TEXT NOT NULL,
    "type" "ArchitectureDiffItemType" NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "GovernanceRuleSeverity" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceNodeName" TEXT,
    "targetNodeName" TEXT,
    "evidence" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchitectureDiffItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceRule" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "severity" "GovernanceRuleSeverity" NOT NULL DEFAULT 'HIGH',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceViolation" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "architectureAnalysisId" TEXT,
    "diffId" TEXT,
    "severity" "GovernanceRuleSeverity" NOT NULL DEFAULT 'HIGH',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sourceNodeId" TEXT,
    "targetNodeId" TEXT,
    "evidence" JSONB,
    "status" "GovernanceViolationStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceViolation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArchitectureSnapshot_repositoryId_idx" ON "ArchitectureSnapshot"("repositoryId");

-- CreateIndex
CREATE INDEX "ArchitectureSnapshot_createdAt_idx" ON "ArchitectureSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "ArchitectureSnapshot_commitSha_idx" ON "ArchitectureSnapshot"("commitSha");

-- CreateIndex
CREATE UNIQUE INDEX "ArchitectureSnapshot_repositoryId_version_key" ON "ArchitectureSnapshot"("repositoryId", "version");

-- CreateIndex
CREATE INDEX "ArchitectureSnapshotNode_snapshotId_idx" ON "ArchitectureSnapshotNode"("snapshotId");

-- CreateIndex
CREATE INDEX "ArchitectureSnapshotNode_qualifiedName_idx" ON "ArchitectureSnapshotNode"("qualifiedName");

-- CreateIndex
CREATE UNIQUE INDEX "ArchitectureSnapshotNode_snapshotId_qualifiedName_key" ON "ArchitectureSnapshotNode"("snapshotId", "qualifiedName");

-- CreateIndex
CREATE INDEX "ArchitectureSnapshotEdge_snapshotId_idx" ON "ArchitectureSnapshotEdge"("snapshotId");

-- CreateIndex
CREATE INDEX "ArchitectureSnapshotEdge_sourceQualifiedName_idx" ON "ArchitectureSnapshotEdge"("sourceQualifiedName");

-- CreateIndex
CREATE INDEX "ArchitectureSnapshotEdge_targetQualifiedName_idx" ON "ArchitectureSnapshotEdge"("targetQualifiedName");

-- CreateIndex
CREATE UNIQUE INDEX "ArchitectureSnapshotEdge_snapshotId_sourceQualifiedName_tar_key" ON "ArchitectureSnapshotEdge"("snapshotId", "sourceQualifiedName", "targetQualifiedName", "type");

-- CreateIndex
CREATE INDEX "ArchitectureDiff_repositoryId_idx" ON "ArchitectureDiff"("repositoryId");

-- CreateIndex
CREATE INDEX "ArchitectureDiff_fromSnapshotId_idx" ON "ArchitectureDiff"("fromSnapshotId");

-- CreateIndex
CREATE INDEX "ArchitectureDiff_toSnapshotId_idx" ON "ArchitectureDiff"("toSnapshotId");

-- CreateIndex
CREATE INDEX "ArchitectureDiffItem_diffId_idx" ON "ArchitectureDiffItem"("diffId");

-- CreateIndex
CREATE INDEX "ArchitectureDiffItem_type_idx" ON "ArchitectureDiffItem"("type");

-- CreateIndex
CREATE INDEX "ArchitectureDiffItem_severity_idx" ON "ArchitectureDiffItem"("severity");

-- CreateIndex
CREATE INDEX "GovernanceRule_repositoryId_idx" ON "GovernanceRule"("repositoryId");

-- CreateIndex
CREATE INDEX "GovernanceRule_ruleType_idx" ON "GovernanceRule"("ruleType");

-- CreateIndex
CREATE INDEX "GovernanceViolation_repositoryId_idx" ON "GovernanceViolation"("repositoryId");

-- CreateIndex
CREATE INDEX "GovernanceViolation_ruleId_idx" ON "GovernanceViolation"("ruleId");

-- CreateIndex
CREATE INDEX "GovernanceViolation_severity_idx" ON "GovernanceViolation"("severity");

-- CreateIndex
CREATE INDEX "GovernanceViolation_status_idx" ON "GovernanceViolation"("status");

-- AddForeignKey
ALTER TABLE "ArchitectureSnapshot" ADD CONSTRAINT "ArchitectureSnapshot_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureSnapshot" ADD CONSTRAINT "ArchitectureSnapshot_architectureAnalysisId_fkey" FOREIGN KEY ("architectureAnalysisId") REFERENCES "ArchitectureAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureSnapshot" ADD CONSTRAINT "ArchitectureSnapshot_systemDesignId_fkey" FOREIGN KEY ("systemDesignId") REFERENCES "SystemDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureSnapshotNode" ADD CONSTRAINT "ArchitectureSnapshotNode_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ArchitectureSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureSnapshotNode" ADD CONSTRAINT "ArchitectureSnapshotNode_graphNodeId_fkey" FOREIGN KEY ("graphNodeId") REFERENCES "GraphNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureSnapshotEdge" ADD CONSTRAINT "ArchitectureSnapshotEdge_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ArchitectureSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureDiff" ADD CONSTRAINT "ArchitectureDiff_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureDiff" ADD CONSTRAINT "ArchitectureDiff_fromSnapshotId_fkey" FOREIGN KEY ("fromSnapshotId") REFERENCES "ArchitectureSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureDiff" ADD CONSTRAINT "ArchitectureDiff_toSnapshotId_fkey" FOREIGN KEY ("toSnapshotId") REFERENCES "ArchitectureSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureDiffItem" ADD CONSTRAINT "ArchitectureDiffItem_diffId_fkey" FOREIGN KEY ("diffId") REFERENCES "ArchitectureDiff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceRule" ADD CONSTRAINT "GovernanceRule_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceViolation" ADD CONSTRAINT "GovernanceViolation_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceViolation" ADD CONSTRAINT "GovernanceViolation_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "GovernanceRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceViolation" ADD CONSTRAINT "GovernanceViolation_architectureAnalysisId_fkey" FOREIGN KEY ("architectureAnalysisId") REFERENCES "ArchitectureAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceViolation" ADD CONSTRAINT "GovernanceViolation_diffId_fkey" FOREIGN KEY ("diffId") REFERENCES "ArchitectureDiff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceViolation" ADD CONSTRAINT "GovernanceViolation_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "GraphNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceViolation" ADD CONSTRAINT "GovernanceViolation_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "GraphNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

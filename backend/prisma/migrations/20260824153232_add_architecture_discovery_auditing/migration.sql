-- CreateEnum
CREATE TYPE "ArchitectureFindingSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ArchitectureFindingType" AS ENUM ('CIRCULAR_DEPENDENCY', 'HIGH_COUPLING', 'ARCHITECTURAL_DRIFT', 'BOUNDARY_VIOLATION', 'ORPHAN_COMPONENT', 'LARGE_COMPONENT', 'DEPENDENCY_HOTSPOT', 'DUPLICATE_STRUCTURE', 'PATTERN_DETECTED', 'RISKY_DEPENDENCY');

-- CreateEnum
CREATE TYPE "ArchitectureAnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "ArchitectureAnalysis" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" "ArchitectureAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "nodesAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "edgesAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "findingsGenerated" INTEGER NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchitectureAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchitectureFinding" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "type" "ArchitectureFindingType" NOT NULL,
    "severity" "ArchitectureFindingSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sourceNodeId" TEXT,
    "targetNodeId" TEXT,
    "evidence" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchitectureFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArchitectureAnalysis_repositoryId_idx" ON "ArchitectureAnalysis"("repositoryId");

-- CreateIndex
CREATE INDEX "ArchitectureAnalysis_status_idx" ON "ArchitectureAnalysis"("status");

-- CreateIndex
CREATE INDEX "ArchitectureFinding_analysisId_idx" ON "ArchitectureFinding"("analysisId");

-- CreateIndex
CREATE INDEX "ArchitectureFinding_repositoryId_idx" ON "ArchitectureFinding"("repositoryId");

-- CreateIndex
CREATE INDEX "ArchitectureFinding_type_idx" ON "ArchitectureFinding"("type");

-- CreateIndex
CREATE INDEX "ArchitectureFinding_severity_idx" ON "ArchitectureFinding"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "ArchitectureFinding_analysisId_type_title_sourceNodeId_targ_key" ON "ArchitectureFinding"("analysisId", "type", "title", "sourceNodeId", "targetNodeId");

-- AddForeignKey
ALTER TABLE "ArchitectureAnalysis" ADD CONSTRAINT "ArchitectureAnalysis_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureFinding" ADD CONSTRAINT "ArchitectureFinding_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ArchitectureAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureFinding" ADD CONSTRAINT "ArchitectureFinding_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureFinding" ADD CONSTRAINT "ArchitectureFinding_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "GraphNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchitectureFinding" ADD CONSTRAINT "ArchitectureFinding_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "GraphNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

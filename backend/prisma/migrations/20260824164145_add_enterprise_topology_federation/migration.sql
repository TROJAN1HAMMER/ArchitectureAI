-- CreateEnum
CREATE TYPE "RepositoryRole" AS ENUM ('FRONTEND', 'BACKEND', 'SERVICE', 'LIBRARY', 'DATABASE', 'INFRASTRUCTURE', 'MOBILE', 'SHARED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RepositoryDependencyType" AS ENUM ('IMPORTS', 'HTTP_CALL', 'API_DEPENDENCY', 'SHARED_LIBRARY', 'DATABASE_DEPENDENCY', 'EVENT_DEPENDENCY', 'CONFIG_DEPENDENCY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DependencyConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "EnterpriseTopologyStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "EnterpriseFindingType" AS ENUM ('CIRCULAR_SERVICE_DEPENDENCY', 'HIGH_SERVICE_COUPLING', 'SINGLE_POINT_OF_FAILURE', 'SHARED_LIBRARY_HOTSPOT', 'CROSS_BOUNDARY_DEPENDENCY', 'DATABASE_COUPLING', 'API_DEPENDENCY_RISK', 'ORPHAN_REPOSITORY', 'DEPENDENCY_HOTSPOT', 'ARCHITECTURAL_DRIFT', 'TOPOLOGY_RISK');

-- CreateEnum
CREATE TYPE "EnterpriseFindingSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "enterpriseSystemId" TEXT,
ADD COLUMN     "role" "RepositoryRole" NOT NULL DEFAULT 'UNKNOWN';

-- CreateTable
CREATE TABLE "EnterpriseSystem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositoryDependency" (
    "id" TEXT NOT NULL,
    "enterpriseSystemId" TEXT NOT NULL,
    "sourceRepositoryId" TEXT NOT NULL,
    "targetRepositoryId" TEXT NOT NULL,
    "type" "RepositoryDependencyType" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" "DependencyConfidence" NOT NULL DEFAULT 'MEDIUM',
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseTopologyAnalysis" (
    "id" TEXT NOT NULL,
    "enterpriseSystemId" TEXT NOT NULL,
    "status" "EnterpriseTopologyStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "repositoriesAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "dependenciesAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "findingsGenerated" INTEGER NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "factorBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseTopologyAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseTopologyFinding" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "enterpriseSystemId" TEXT NOT NULL,
    "type" "EnterpriseFindingType" NOT NULL,
    "severity" "EnterpriseFindingSeverity" NOT NULL DEFAULT 'HIGH',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sourceRepositoryId" TEXT,
    "targetRepositoryId" TEXT,
    "evidence" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnterpriseTopologyFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnterpriseSystem_userId_idx" ON "EnterpriseSystem"("userId");

-- CreateIndex
CREATE INDEX "EnterpriseSystem_createdAt_idx" ON "EnterpriseSystem"("createdAt");

-- CreateIndex
CREATE INDEX "RepositoryDependency_enterpriseSystemId_idx" ON "RepositoryDependency"("enterpriseSystemId");

-- CreateIndex
CREATE INDEX "RepositoryDependency_sourceRepositoryId_idx" ON "RepositoryDependency"("sourceRepositoryId");

-- CreateIndex
CREATE INDEX "RepositoryDependency_targetRepositoryId_idx" ON "RepositoryDependency"("targetRepositoryId");

-- CreateIndex
CREATE INDEX "RepositoryDependency_type_idx" ON "RepositoryDependency"("type");

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryDependency_sourceRepositoryId_targetRepositoryId__key" ON "RepositoryDependency"("sourceRepositoryId", "targetRepositoryId", "type");

-- CreateIndex
CREATE INDEX "EnterpriseTopologyAnalysis_enterpriseSystemId_idx" ON "EnterpriseTopologyAnalysis"("enterpriseSystemId");

-- CreateIndex
CREATE INDEX "EnterpriseTopologyAnalysis_status_idx" ON "EnterpriseTopologyAnalysis"("status");

-- CreateIndex
CREATE INDEX "EnterpriseTopologyFinding_analysisId_idx" ON "EnterpriseTopologyFinding"("analysisId");

-- CreateIndex
CREATE INDEX "EnterpriseTopologyFinding_enterpriseSystemId_idx" ON "EnterpriseTopologyFinding"("enterpriseSystemId");

-- CreateIndex
CREATE INDEX "EnterpriseTopologyFinding_type_idx" ON "EnterpriseTopologyFinding"("type");

-- CreateIndex
CREATE INDEX "EnterpriseTopologyFinding_severity_idx" ON "EnterpriseTopologyFinding"("severity");

-- CreateIndex
CREATE INDEX "Repository_enterpriseSystemId_idx" ON "Repository"("enterpriseSystemId");

-- CreateIndex
CREATE INDEX "Repository_role_idx" ON "Repository"("role");

-- AddForeignKey
ALTER TABLE "EnterpriseSystem" ADD CONSTRAINT "EnterpriseSystem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_enterpriseSystemId_fkey" FOREIGN KEY ("enterpriseSystemId") REFERENCES "EnterpriseSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryDependency" ADD CONSTRAINT "RepositoryDependency_enterpriseSystemId_fkey" FOREIGN KEY ("enterpriseSystemId") REFERENCES "EnterpriseSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryDependency" ADD CONSTRAINT "RepositoryDependency_sourceRepositoryId_fkey" FOREIGN KEY ("sourceRepositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryDependency" ADD CONSTRAINT "RepositoryDependency_targetRepositoryId_fkey" FOREIGN KEY ("targetRepositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseTopologyAnalysis" ADD CONSTRAINT "EnterpriseTopologyAnalysis_enterpriseSystemId_fkey" FOREIGN KEY ("enterpriseSystemId") REFERENCES "EnterpriseSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseTopologyFinding" ADD CONSTRAINT "EnterpriseTopologyFinding_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "EnterpriseTopologyAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseTopologyFinding" ADD CONSTRAINT "EnterpriseTopologyFinding_enterpriseSystemId_fkey" FOREIGN KEY ("enterpriseSystemId") REFERENCES "EnterpriseSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseTopologyFinding" ADD CONSTRAINT "EnterpriseTopologyFinding_sourceRepositoryId_fkey" FOREIGN KEY ("sourceRepositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseTopologyFinding" ADD CONSTRAINT "EnterpriseTopologyFinding_targetRepositoryId_fkey" FOREIGN KEY ("targetRepositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "DiagramType" AS ENUM ('SYSTEM_CONTEXT', 'CONTAINER', 'COMPONENT');

-- CreateEnum
CREATE TYPE "DiagramNodeType" AS ENUM ('PERSON', 'SYSTEM', 'CONTAINER', 'COMPONENT', 'DATABASE', 'EXTERNAL_SYSTEM', 'API', 'SERVICE', 'MODULE');

-- CreateEnum
CREATE TYPE "DiagramEdgeType" AS ENUM ('USES', 'CALLS', 'DEPENDS_ON', 'CONTAINS', 'READS', 'WRITES', 'EXPOSES', 'IMPORTS');

-- CreateTable
CREATE TABLE "SystemDesign" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagram" (
    "id" TEXT NOT NULL,
    "systemDesignId" TEXT NOT NULL,
    "type" "DiagramType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagramNode" (
    "id" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    "graphNodeId" TEXT,
    "type" "DiagramNodeType" NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 160.0,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagramNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagramEdge" (
    "id" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "type" "DiagramEdgeType" NOT NULL,
    "label" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagramEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemDesign_repositoryId_idx" ON "SystemDesign"("repositoryId");

-- CreateIndex
CREATE INDEX "SystemDesign_version_idx" ON "SystemDesign"("version");

-- CreateIndex
CREATE INDEX "Diagram_systemDesignId_idx" ON "Diagram"("systemDesignId");

-- CreateIndex
CREATE INDEX "Diagram_type_idx" ON "Diagram"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Diagram_systemDesignId_type_key" ON "Diagram"("systemDesignId", "type");

-- CreateIndex
CREATE INDEX "DiagramNode_diagramId_idx" ON "DiagramNode"("diagramId");

-- CreateIndex
CREATE INDEX "DiagramNode_type_idx" ON "DiagramNode"("type");

-- CreateIndex
CREATE INDEX "DiagramNode_graphNodeId_idx" ON "DiagramNode"("graphNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagramNode_diagramId_name_key" ON "DiagramNode"("diagramId", "name");

-- CreateIndex
CREATE INDEX "DiagramEdge_diagramId_idx" ON "DiagramEdge"("diagramId");

-- CreateIndex
CREATE INDEX "DiagramEdge_sourceNodeId_idx" ON "DiagramEdge"("sourceNodeId");

-- CreateIndex
CREATE INDEX "DiagramEdge_targetNodeId_idx" ON "DiagramEdge"("targetNodeId");

-- CreateIndex
CREATE INDEX "DiagramEdge_type_idx" ON "DiagramEdge"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DiagramEdge_diagramId_sourceNodeId_targetNodeId_type_key" ON "DiagramEdge"("diagramId", "sourceNodeId", "targetNodeId", "type");

-- AddForeignKey
ALTER TABLE "SystemDesign" ADD CONSTRAINT "SystemDesign_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagram" ADD CONSTRAINT "Diagram_systemDesignId_fkey" FOREIGN KEY ("systemDesignId") REFERENCES "SystemDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagramNode" ADD CONSTRAINT "DiagramNode_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "Diagram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagramNode" ADD CONSTRAINT "DiagramNode_graphNodeId_fkey" FOREIGN KEY ("graphNodeId") REFERENCES "GraphNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagramEdge" ADD CONSTRAINT "DiagramEdge_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "Diagram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagramEdge" ADD CONSTRAINT "DiagramEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "DiagramNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagramEdge" ADD CONSTRAINT "DiagramEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "DiagramNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

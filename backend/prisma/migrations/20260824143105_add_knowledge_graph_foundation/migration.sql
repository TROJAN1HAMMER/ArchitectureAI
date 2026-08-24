-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('REPOSITORY', 'DIRECTORY', 'FILE', 'MODULE', 'CLASS', 'FUNCTION', 'INTERFACE', 'COMPONENT', 'API_ENDPOINT', 'DATABASE_MODEL');

-- CreateEnum
CREATE TYPE "EdgeType" AS ENUM ('CONTAINS', 'IMPORTS', 'DEPENDS_ON', 'CALLS', 'EXTENDS', 'IMPLEMENTS', 'EXPOSES', 'USES', 'DEFINES');

-- CreateTable
CREATE TABLE "GraphNode" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "fileId" TEXT,
    "type" "NodeType" NOT NULL,
    "name" TEXT NOT NULL,
    "qualifiedName" TEXT NOT NULL,
    "path" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphEdge" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "type" "EdgeType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GraphNode_repositoryId_idx" ON "GraphNode"("repositoryId");

-- CreateIndex
CREATE INDEX "GraphNode_type_idx" ON "GraphNode"("type");

-- CreateIndex
CREATE INDEX "GraphNode_fileId_idx" ON "GraphNode"("fileId");

-- CreateIndex
CREATE INDEX "GraphNode_qualifiedName_idx" ON "GraphNode"("qualifiedName");

-- CreateIndex
CREATE UNIQUE INDEX "GraphNode_repositoryId_qualifiedName_key" ON "GraphNode"("repositoryId", "qualifiedName");

-- CreateIndex
CREATE INDEX "GraphEdge_repositoryId_idx" ON "GraphEdge"("repositoryId");

-- CreateIndex
CREATE INDEX "GraphEdge_sourceNodeId_idx" ON "GraphEdge"("sourceNodeId");

-- CreateIndex
CREATE INDEX "GraphEdge_targetNodeId_idx" ON "GraphEdge"("targetNodeId");

-- CreateIndex
CREATE INDEX "GraphEdge_type_idx" ON "GraphEdge"("type");

-- CreateIndex
CREATE UNIQUE INDEX "GraphEdge_repositoryId_sourceNodeId_targetNodeId_type_key" ON "GraphEdge"("repositoryId", "sourceNodeId", "targetNodeId", "type");

-- AddForeignKey
ALTER TABLE "GraphNode" ADD CONSTRAINT "GraphNode_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphNode" ADD CONSTRAINT "GraphNode_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "RepositoryFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "GraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "GraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

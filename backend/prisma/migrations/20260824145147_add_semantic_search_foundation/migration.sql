-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "fileId" TEXT,
    "graphNodeId" TEXT,
    "contentHash" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "totalChunks" INTEGER NOT NULL DEFAULT 1,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemanticIndex" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "filesDiscovered" INTEGER NOT NULL DEFAULT 0,
    "filesProcessed" INTEGER NOT NULL DEFAULT 0,
    "filesSkipped" INTEGER NOT NULL DEFAULT 0,
    "filesFailed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemanticIndex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Embedding_repositoryId_idx" ON "Embedding"("repositoryId");

-- CreateIndex
CREATE INDEX "Embedding_fileId_idx" ON "Embedding"("fileId");

-- CreateIndex
CREATE INDEX "Embedding_contentHash_idx" ON "Embedding"("contentHash");

-- CreateIndex
CREATE INDEX "Embedding_model_idx" ON "Embedding"("model");

-- CreateIndex
CREATE UNIQUE INDEX "Embedding_repositoryId_fileId_chunkIndex_model_key" ON "Embedding"("repositoryId", "fileId", "chunkIndex", "model");

-- CreateIndex
CREATE INDEX "SemanticIndex_repositoryId_idx" ON "SemanticIndex"("repositoryId");

-- CreateIndex
CREATE INDEX "SemanticIndex_status_idx" ON "SemanticIndex"("status");

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "RepositoryFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_graphNodeId_fkey" FOREIGN KEY ("graphNodeId") REFERENCES "GraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemanticIndex" ADD CONSTRAINT "SemanticIndex_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

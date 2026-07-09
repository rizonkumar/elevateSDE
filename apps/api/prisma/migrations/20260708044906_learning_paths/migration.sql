-- CreateEnum
CREATE TYPE "PathLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" "PathLevel" NOT NULL DEFAULT 'BEGINNER',
    "tags" TEXT[],
    "coverImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathModule" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "LearningPathModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathItem" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "LearningPathItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PathEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningPath_slug_key" ON "LearningPath"("slug");

-- CreateIndex
CREATE INDEX "LearningPath_isPublished_order_idx" ON "LearningPath"("isPublished", "order");

-- CreateIndex
CREATE INDEX "LearningPath_tenantId_idx" ON "LearningPath"("tenantId");

-- CreateIndex
CREATE INDEX "LearningPathModule_pathId_order_idx" ON "LearningPathModule"("pathId", "order");

-- CreateIndex
CREATE INDEX "LearningPathItem_moduleId_order_idx" ON "LearningPathItem"("moduleId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathItem_moduleId_problemId_key" ON "LearningPathItem"("moduleId", "problemId");

-- CreateIndex
CREATE INDEX "PathEnrollment_userId_idx" ON "PathEnrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PathEnrollment_userId_pathId_key" ON "PathEnrollment"("userId", "pathId");

-- AddForeignKey
ALTER TABLE "LearningPathModule" ADD CONSTRAINT "LearningPathModule_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathItem" ADD CONSTRAINT "LearningPathItem_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LearningPathModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathItem" ADD CONSTRAINT "LearningPathItem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathEnrollment" ADD CONSTRAINT "PathEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathEnrollment" ADD CONSTRAINT "PathEnrollment_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

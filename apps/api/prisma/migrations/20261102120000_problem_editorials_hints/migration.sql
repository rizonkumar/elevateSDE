-- CreateEnum
CREATE TYPE "EditorialUnlockReason" AS ENUM ('SOLVED', 'GAVE_UP');

-- CreateTable
CREATE TABLE "ProblemEditorial" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "timeComplexity" TEXT NOT NULL,
    "spaceComplexity" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemEditorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemHint" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "ProblemHint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemAssistance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "tenantId" TEXT,
    "hintsRevealed" INTEGER NOT NULL DEFAULT 0,
    "editorialUnlockedAt" TIMESTAMP(3),
    "editorialUnlockReason" "EditorialUnlockReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemAssistance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProblemEditorial_problemId_key" ON "ProblemEditorial"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemHint_problemId_ordinal_key" ON "ProblemHint"("problemId", "ordinal");

-- CreateIndex
CREATE INDEX "ProblemAssistance_problemId_idx" ON "ProblemAssistance"("problemId");

-- CreateIndex
CREATE INDEX "ProblemAssistance_tenantId_idx" ON "ProblemAssistance"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemAssistance_userId_problemId_key" ON "ProblemAssistance"("userId", "problemId");

-- AddForeignKey
ALTER TABLE "ProblemEditorial" ADD CONSTRAINT "ProblemEditorial_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemHint" ADD CONSTRAINT "ProblemHint_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAssistance" ADD CONSTRAINT "ProblemAssistance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemAssistance" ADD CONSTRAINT "ProblemAssistance_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

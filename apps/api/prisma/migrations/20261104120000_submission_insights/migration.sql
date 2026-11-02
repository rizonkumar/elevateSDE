-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "memoryPercentile" DOUBLE PRECISION,
ADD COLUMN     "runtimePercentile" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Submission_userId_problemId_createdAt_idx" ON "Submission"("userId", "problemId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Submission_problemId_language_status_userId_idx" ON "Submission"("problemId", "language", "status", "userId");

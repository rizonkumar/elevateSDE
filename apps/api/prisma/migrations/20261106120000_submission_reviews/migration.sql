-- CreateEnum
CREATE TYPE "CodeReviewStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CodeReviewEngine" AS ENUM ('LLM', 'DETERMINISTIC');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CODE_REVIEW_READY';

-- CreateTable
CREATE TABLE "SubmissionReview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "status" "CodeReviewStatus" NOT NULL DEFAULT 'PENDING',
    "engine" "CodeReviewEngine",
    "timeComplexity" TEXT,
    "spaceComplexity" TEXT,
    "summary" TEXT,
    "findings" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SubmissionReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionReview_submissionId_key" ON "SubmissionReview"("submissionId");

-- CreateIndex
CREATE INDEX "SubmissionReview_userId_createdAt_idx" ON "SubmissionReview"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SubmissionReview_tenantId_idx" ON "SubmissionReview"("tenantId");

-- AddForeignKey
ALTER TABLE "SubmissionReview" ADD CONSTRAINT "SubmissionReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionReview" ADD CONSTRAINT "SubmissionReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

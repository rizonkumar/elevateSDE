-- CreateEnum
CREATE TYPE "MockInterviewTopic" AS ENUM ('SYSTEM_DESIGN', 'BEHAVIORAL', 'CODING', 'DSA');

-- CreateEnum
CREATE TYPE "MockInterviewRoleLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'STAFF');

-- CreateEnum
CREATE TYPE "MockInterviewCompanyStyle" AS ENUM ('GENERIC', 'FAANG', 'STARTUP', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "MockInterviewStatus" AS ENUM ('ACTIVE', 'SCORING', 'COMPLETED', 'FAILED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MockInterviewEngine" AS ENUM ('LLM', 'DETERMINISTIC');

-- CreateTable
CREATE TABLE "MockInterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "topic" "MockInterviewTopic" NOT NULL,
    "roleLevel" "MockInterviewRoleLevel" NOT NULL,
    "companyStyle" "MockInterviewCompanyStyle" NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "MockInterviewStatus" NOT NULL DEFAULT 'ACTIVE',
    "engine" "MockInterviewEngine" NOT NULL,
    "preparationTaskId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "overallScore" INTEGER,
    "competencies" JSONB,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "summary" TEXT,
    "failureReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockInterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockInterviewTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "scores" JSONB,
    "score" INTEGER,
    "feedback" TEXT,

    CONSTRAINT "MockInterviewTurn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MockInterviewSession_userId_startedAt_idx" ON "MockInterviewSession"("userId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "MockInterviewSession_userId_status_idx" ON "MockInterviewSession"("userId", "status");

-- CreateIndex
CREATE INDEX "MockInterviewSession_userId_topic_status_endedAt_idx" ON "MockInterviewSession"("userId", "topic", "status", "endedAt" DESC);

-- CreateIndex
CREATE INDEX "MockInterviewSession_status_deadlineAt_idx" ON "MockInterviewSession"("status", "deadlineAt");

-- CreateIndex
CREATE INDEX "MockInterviewSession_tenantId_idx" ON "MockInterviewSession"("tenantId");

-- CreateIndex
CREATE INDEX "MockInterviewSession_preparationTaskId_idx" ON "MockInterviewSession"("preparationTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "MockInterviewTurn_sessionId_ordinal_key" ON "MockInterviewTurn"("sessionId", "ordinal");

-- AddForeignKey
ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_preparationTaskId_fkey" FOREIGN KEY ("preparationTaskId") REFERENCES "PreparationTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewTurn" ADD CONSTRAINT "MockInterviewTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MockInterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;


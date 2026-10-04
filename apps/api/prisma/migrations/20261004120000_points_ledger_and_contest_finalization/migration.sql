-- CreateEnum
CREATE TYPE "PointSource" AS ENUM ('PROBLEM_SOLVED', 'DAILY_CHALLENGE', 'CONTEST_RESULT', 'ADMIN_ADJUSTMENT');

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "finalizedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ContestParticipant" ADD COLUMN     "finalPenaltySeconds" INTEGER,
ADD COLUMN     "finalRank" INTEGER,
ADD COLUMN     "finalScore" INTEGER;

-- CreateTable
CREATE TABLE "PointLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "source" "PointSource" NOT NULL,
    "refId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointLedger_userId_createdAt_idx" ON "PointLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PointLedger_tenantId_idx" ON "PointLedger"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PointLedger_userId_source_refId_key" ON "PointLedger"("userId", "source", "refId");

-- CreateIndex
CREATE INDEX "Contest_finalizedAt_endsAt_idx" ON "Contest"("finalizedAt", "endsAt");

-- CreateIndex
CREATE INDEX "InterviewPreparationPlan_status_targetAt_idx" ON "InterviewPreparationPlan"("status", "targetAt");

-- AddForeignKey
ALTER TABLE "PointLedger" ADD CONSTRAINT "PointLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


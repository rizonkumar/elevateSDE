-- AlterTable
ALTER TABLE "UserStats" ADD COLUMN     "lastActiveDate" DATE,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "challengeDate" DATE NOT NULL,
    "problemId" TEXT NOT NULL,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyChallengeId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallengeCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyChallenge_challengeDate_idx" ON "DailyChallenge"("challengeDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_challengeDate_tenantId_key" ON "DailyChallenge"("challengeDate", "tenantId");

-- CreateIndex
CREATE INDEX "DailyChallengeCompletion_dailyChallengeId_idx" ON "DailyChallengeCompletion"("dailyChallengeId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeCompletion_userId_dailyChallengeId_key" ON "DailyChallengeCompletion"("userId", "dailyChallengeId");

-- AddForeignKey
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeCompletion" ADD CONSTRAINT "DailyChallengeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeCompletion" ADD CONSTRAINT "DailyChallengeCompletion_dailyChallengeId_fkey" FOREIGN KEY ("dailyChallengeId") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

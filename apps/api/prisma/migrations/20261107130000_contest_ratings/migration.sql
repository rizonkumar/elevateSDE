-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CONTEST_RATING_UPDATED';

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "isRated" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ratedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserRating" (
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1500,
    "peakRating" INTEGER NOT NULL DEFAULT 1500,
    "contestsRated" INTEGER NOT NULL DEFAULT 0,
    "lastRatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRating_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ContestRatingChange" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "rank" INTEGER NOT NULL,
    "oldRating" INTEGER NOT NULL,
    "newRating" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "performance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestRatingChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRating_rating_idx" ON "UserRating"("rating" DESC);

-- CreateIndex
CREATE INDEX "ContestRatingChange_userId_createdAt_idx" ON "ContestRatingChange"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ContestRatingChange_tenantId_idx" ON "ContestRatingChange"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestRatingChange_contestId_userId_key" ON "ContestRatingChange"("contestId", "userId");

-- CreateIndex
CREATE INDEX "Contest_ratedAt_endsAt_idx" ON "Contest"("ratedAt", "endsAt");

-- AddForeignKey
ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestRatingChange" ADD CONSTRAINT "ContestRatingChange_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestRatingChange" ADD CONSTRAINT "ContestRatingChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "PointsSource" AS ENUM ('FIRST_SOLVE');

-- CreateTable
CREATE TABLE "PointsAward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "PointsSource" NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointsAward_userId_awardedAt_idx" ON "PointsAward"("userId", "awardedAt");

-- CreateIndex
CREATE INDEX "PointsAward_awardedAt_idx" ON "PointsAward"("awardedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PointsAward_userId_source_sourceRef_key" ON "PointsAward"("userId", "source", "sourceRef");

-- CreateIndex
CREATE INDEX "UserStats_points_idx" ON "UserStats"("points");

-- CreateIndex
CREATE INDEX "UserStats_monthlyPoints_idx" ON "UserStats"("monthlyPoints");

-- CreateIndex
CREATE INDEX "UserStats_weeklyPoints_idx" ON "UserStats"("weeklyPoints");

-- AddForeignKey
ALTER TABLE "PointsAward" ADD CONSTRAINT "PointsAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

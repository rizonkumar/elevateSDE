-- CreateTable
CREATE TABLE "ReviewItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewItem_userId_dueAt_idx" ON "ReviewItem"("userId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewItem_userId_problemId_key" ON "ReviewItem"("userId", "problemId");

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

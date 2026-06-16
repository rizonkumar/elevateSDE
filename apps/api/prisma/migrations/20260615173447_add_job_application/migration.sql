-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED');

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "salaryRange" TEXT,
    "jobDescriptionUrl" TEXT,
    "interviewDate" TIMESTAMP(3),
    "boardPosition" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobApplication_userId_status_idx" ON "JobApplication"("userId", "status");

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

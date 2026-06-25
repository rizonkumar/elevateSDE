/*
  Warnings:

  - Added the required column `updatedAt` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubmissionStatus" ADD VALUE 'QUEUED';
ALTER TYPE "SubmissionStatus" ADD VALUE 'RUNNING';

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateEnum
CREATE TYPE "AssessmentDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AssessmentLanguage" AS ENUM ('JAVASCRIPT', 'PYTHON', 'CPP');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'COMPILE_ERROR');

-- CreateEnum
CREATE TYPE "TestCaseResultStatus" AS ENUM ('PASS', 'FAIL', 'ERROR');

-- CreateEnum
CREATE TYPE "ComparisonMode" AS ENUM ('EXACT', 'UNORDERED', 'FLOAT_TOLERANT');

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "AssessmentDifficulty" NOT NULL,
    "description" TEXT NOT NULL,
    "constraints" TEXT[],
    "tags" TEXT[],
    "starterCode" JSONB NOT NULL,
    "examples" JSONB NOT NULL,
    "functionName" TEXT NOT NULL,
    "harness" JSONB NOT NULL,
    "referenceSolution" JSONB NOT NULL,
    "comparisonMode" "ComparisonMode" NOT NULL DEFAULT 'EXACT',
    "timeLimitMinutes" INTEGER NOT NULL DEFAULT 30,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemTestCase" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProblemTestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" "AssessmentLanguage" NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "totalRuntimeMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peakMemoryKb" INTEGER NOT NULL DEFAULT 0,
    "stdout" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionResult" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "TestCaseResultStatus" NOT NULL,
    "actualOutput" TEXT NOT NULL DEFAULT '',
    "runtimeMs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memoryKb" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SubmissionResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");

-- CreateIndex
CREATE INDEX "Problem_difficulty_isPublished_idx" ON "Problem"("difficulty", "isPublished");

-- CreateIndex
CREATE INDEX "ProblemTestCase_problemId_isHidden_idx" ON "ProblemTestCase"("problemId", "isHidden");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTestCase_problemId_ordinal_key" ON "ProblemTestCase"("problemId", "ordinal");

-- CreateIndex
CREATE INDEX "Submission_userId_problemId_idx" ON "Submission"("userId", "problemId");

-- CreateIndex
CREATE INDEX "Submission_problemId_status_idx" ON "Submission"("problemId", "status");

-- CreateIndex
CREATE INDEX "SubmissionResult_submissionId_idx" ON "SubmissionResult"("submissionId");

-- AddForeignKey
ALTER TABLE "ProblemTestCase" ADD CONSTRAINT "ProblemTestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionResult" ADD CONSTRAINT "SubmissionResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

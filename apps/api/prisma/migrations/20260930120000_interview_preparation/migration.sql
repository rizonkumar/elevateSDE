CREATE TYPE "InterviewPreparationArchetype" AS ENUM ('GENERAL', 'FAANG', 'STARTUP', 'ENTERPRISE');
CREATE TYPE "InterviewRoundType" AS ENUM ('CODING', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'RESUME_ROLE_FIT', 'CUSTOM');
CREATE TYPE "InterviewPreparationPlanStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'COMPLETED');
CREATE TYPE "PreparationTaskStatus" AS ENUM ('PENDING', 'COMPLETED');
CREATE TYPE "PreparationTaskType" AS ENUM ('SOLVE_PROBLEM', 'REVIEW_PROBLEM', 'COMPLETE_PATH', 'ANALYZE_RESUME', 'RUN_MOCK_INTERVIEW', 'SCHEDULE_PEER_PRACTICE', 'CUSTOM');
CREATE TYPE "PreparationResourceType" AS ENUM ('PROBLEM', 'PROBLEM_COLLECTION', 'LEARNING_PATH', 'REVIEW_QUEUE', 'RESUME_ANALYSIS', 'MOCK_INTERVIEW', 'PEER_SESSION');
CREATE TYPE "InterviewReadinessStatus" AS ENUM ('INSUFFICIENT_EVIDENCE', 'NEEDS_WORK', 'PROGRESSING', 'READY');
CREATE TYPE "PeerPracticeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

CREATE TABLE "InterviewPreparationPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobApplicationId" TEXT NOT NULL,
  "targetAt" TIMESTAMP(3) NOT NULL,
  "timeZone" TEXT NOT NULL,
  "archetype" "InterviewPreparationArchetype" NOT NULL,
  "status" "InterviewPreparationPlanStatus" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InterviewPreparationPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterviewPreparationRound" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "type" "InterviewRoundType" NOT NULL,
  "title" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "ordinal" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InterviewPreparationRound_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InterviewPreparationRound_weight_check" CHECK ("weight" > 0)
);

CREATE TABLE "PreparationTask" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "roundId" TEXT,
  "type" "PreparationTaskType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "PreparationTaskStatus" NOT NULL DEFAULT 'PENDING',
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "resourceType" "PreparationResourceType",
  "resourceId" TEXT,
  "deepLink" TEXT,
  "ordinal" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PreparationTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReadinessSnapshot" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "formulaVersion" TEXT NOT NULL,
  "score" DOUBLE PRECISION,
  "status" "InterviewReadinessStatus" NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "coverage" DOUBLE PRECISION NOT NULL,
  "rounds" JSONB NOT NULL,
  "deterministicRecommendations" TEXT[],
  "aiExplanation" TEXT,
  "aiSnapshotId" TEXT,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadinessSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReadinessSnapshot_score_check" CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100)),
  CONSTRAINT "ReadinessSnapshot_confidence_check" CHECK ("confidence" >= 0 AND "confidence" <= 1),
  CONSTRAINT "ReadinessSnapshot_coverage_check" CHECK ("coverage" >= 0 AND "coverage" <= 1)
);

CREATE TABLE "PeerPracticeSession" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "roundId" TEXT NOT NULL,
  "organizerId" TEXT NOT NULL,
  "inviteeId" TEXT NOT NULL,
  "status" "PeerPracticeStatus" NOT NULL DEFAULT 'PENDING',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "timeZone" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "meetingUrl" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PeerPracticeSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PeerPracticeSession_participants_check" CHECK ("organizerId" <> "inviteeId"),
  CONSTRAINT "PeerPracticeSession_duration_check" CHECK ("durationMinutes" > 0)
);

CREATE TABLE "PeerScorecard" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "evaluatorId" TEXT NOT NULL,
  "communication" INTEGER NOT NULL,
  "problemSolving" INTEGER NOT NULL,
  "technicalDepth" INTEGER NOT NULL,
  "structure" INTEGER NOT NULL,
  "strengths" TEXT[],
  "improvements" TEXT[],
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PeerScorecard_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PeerScorecard_scores_check" CHECK (
    "communication" BETWEEN 0 AND 100 AND
    "problemSolving" BETWEEN 0 AND 100 AND
    "technicalDepth" BETWEEN 0 AND 100 AND
    "structure" BETWEEN 0 AND 100
  )
);

CREATE UNIQUE INDEX "InterviewPreparationPlan_jobApplicationId_key" ON "InterviewPreparationPlan"("jobApplicationId");
CREATE INDEX "InterviewPreparationPlan_userId_status_targetAt_idx" ON "InterviewPreparationPlan"("userId", "status", "targetAt");
CREATE UNIQUE INDEX "InterviewPreparationRound_planId_ordinal_key" ON "InterviewPreparationRound"("planId", "ordinal");
CREATE INDEX "InterviewPreparationRound_planId_type_idx" ON "InterviewPreparationRound"("planId", "type");
CREATE UNIQUE INDEX "PreparationTask_planId_ordinal_key" ON "PreparationTask"("planId", "ordinal");
CREATE INDEX "PreparationTask_planId_status_dueAt_idx" ON "PreparationTask"("planId", "status", "dueAt");
CREATE INDEX "PreparationTask_roundId_ordinal_idx" ON "PreparationTask"("roundId", "ordinal");
CREATE INDEX "ReadinessSnapshot_planId_calculatedAt_idx" ON "ReadinessSnapshot"("planId", "calculatedAt" DESC);
CREATE INDEX "PeerPracticeSession_organizerId_startsAt_idx" ON "PeerPracticeSession"("organizerId", "startsAt");
CREATE INDEX "PeerPracticeSession_inviteeId_startsAt_idx" ON "PeerPracticeSession"("inviteeId", "startsAt");
CREATE INDEX "PeerPracticeSession_planId_status_idx" ON "PeerPracticeSession"("planId", "status");
CREATE UNIQUE INDEX "PeerScorecard_sessionId_evaluatorId_key" ON "PeerScorecard"("sessionId", "evaluatorId");
CREATE INDEX "PeerScorecard_evaluatorId_submittedAt_idx" ON "PeerScorecard"("evaluatorId", "submittedAt");

ALTER TABLE "InterviewPreparationPlan" ADD CONSTRAINT "InterviewPreparationPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewPreparationPlan" ADD CONSTRAINT "InterviewPreparationPlan_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewPreparationRound" ADD CONSTRAINT "InterviewPreparationRound_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InterviewPreparationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PreparationTask" ADD CONSTRAINT "PreparationTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InterviewPreparationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PreparationTask" ADD CONSTRAINT "PreparationTask_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "InterviewPreparationRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReadinessSnapshot" ADD CONSTRAINT "ReadinessSnapshot_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InterviewPreparationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerPracticeSession" ADD CONSTRAINT "PeerPracticeSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InterviewPreparationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerPracticeSession" ADD CONSTRAINT "PeerPracticeSession_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "InterviewPreparationRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerPracticeSession" ADD CONSTRAINT "PeerPracticeSession_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerPracticeSession" ADD CONSTRAINT "PeerPracticeSession_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerScorecard" ADD CONSTRAINT "PeerScorecard_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PeerPracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerScorecard" ADD CONSTRAINT "PeerScorecard_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

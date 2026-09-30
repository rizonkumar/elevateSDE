ALTER TABLE "InterviewPreparationPlan" ADD COLUMN "readinessRevision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ReadinessSnapshot" ADD COLUMN "sourceRevision" INTEGER NOT NULL DEFAULT 0;

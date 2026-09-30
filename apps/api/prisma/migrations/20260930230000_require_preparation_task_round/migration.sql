DELETE FROM "PreparationTask" WHERE "roundId" IS NULL;
ALTER TABLE "PreparationTask" DROP CONSTRAINT "PreparationTask_roundId_fkey";
ALTER TABLE "PreparationTask" ALTER COLUMN "roundId" SET NOT NULL;
ALTER TABLE "PreparationTask" ADD CONSTRAINT "PreparationTask_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "InterviewPreparationRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

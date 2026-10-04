ALTER TABLE "RefreshToken" ADD COLUMN "familyId" TEXT,
ADD COLUMN "rotatedAt" TIMESTAMP(3);

UPDATE "RefreshToken" SET "familyId" = "id" WHERE "familyId" IS NULL;

ALTER TABLE "RefreshToken" ALTER COLUMN "familyId" SET NOT NULL;

CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

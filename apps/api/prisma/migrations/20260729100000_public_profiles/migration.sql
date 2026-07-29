-- AlterTable
ALTER TABLE "User" ADD COLUMN     "handle" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "isProfilePublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "websiteUrl" TEXT;

DO $$
DECLARE
  target      RECORD;
  base_handle TEXT;
  candidate   TEXT;
  suffix      INT;
BEGIN
  FOR target IN
    SELECT id, "firstName", "lastName", email FROM "User" ORDER BY "createdAt", id
  LOOP
    base_handle := regexp_replace(
      lower(coalesce(
        nullif(trim(concat_ws(' ', target."firstName", target."lastName")), ''),
        split_part(target.email, '@', 1)
      )),
      '[^a-z0-9]+', '-', 'g'
    );
    base_handle := trim(both '-' from left(base_handle, 28));

    IF length(base_handle) < 3 THEN
      base_handle := 'member-' || substr(replace(target.id, '-', ''), 1, 8);
    END IF;

    candidate := base_handle;
    suffix := 2;
    WHILE EXISTS (SELECT 1 FROM "User" WHERE "handle" = candidate) LOOP
      candidate := base_handle || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;

    UPDATE "User" SET "handle" = candidate WHERE id = target.id;
  END LOOP;
END $$;

UPDATE "User" SET "isProfilePublic" = false;

ALTER TABLE "User" ALTER COLUMN "handle" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE INDEX "User_isProfilePublic_idx" ON "User"("isProfilePublic");

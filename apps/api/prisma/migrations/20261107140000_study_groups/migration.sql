-- CreateEnum
CREATE TYPE "StudyGroupRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "StudyGroupJoinPolicy" AS ENUM ('OPEN', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "StudyGoalMetric" AS ENUM ('PROBLEMS_SOLVED', 'POINTS', 'DAILY_CHALLENGES', 'CONTESTS_ENTERED');

-- CreateEnum
CREATE TYPE "StudyGoalScope" AS ENUM ('GROUP_TOTAL', 'EACH_MEMBER');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'STUDY_GROUP_ADDED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'STUDY_GOAL_COMPLETED';

-- CreateTable
CREATE TABLE "StudyGroup" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "joinPolicy" "StudyGroupJoinPolicy" NOT NULL DEFAULT 'INVITE_ONLY',
    "createdById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "StudyGroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGroupGoal" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metric" "StudyGoalMetric" NOT NULL,
    "scope" "StudyGoalScope" NOT NULL,
    "target" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyGroupGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyGroup_tenantId_archivedAt_idx" ON "StudyGroup"("tenantId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudyGroup_tenantId_name_key" ON "StudyGroup"("tenantId", "name");

-- CreateIndex
CREATE INDEX "StudyGroupMember_userId_idx" ON "StudyGroupMember"("userId");

-- CreateIndex
CREATE INDEX "StudyGroupMember_tenantId_idx" ON "StudyGroupMember"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyGroupMember_groupId_userId_key" ON "StudyGroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "StudyGroupGoal_groupId_endsAt_idx" ON "StudyGroupGoal"("groupId", "endsAt");

-- CreateIndex
CREATE INDEX "StudyGroupGoal_tenantId_idx" ON "StudyGroupGoal"("tenantId");

-- AddForeignKey
ALTER TABLE "StudyGroup" ADD CONSTRAINT "StudyGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroup" ADD CONSTRAINT "StudyGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupMember" ADD CONSTRAINT "StudyGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupMember" ADD CONSTRAINT "StudyGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupGoal" ADD CONSTRAINT "StudyGroupGoal_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

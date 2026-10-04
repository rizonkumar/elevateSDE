INSERT INTO "PointLedger" ("id", "userId", "tenantId", "source", "refId", "delta", "createdAt")
SELECT gen_random_uuid()::text, s."userId", u."tenantId", 'PROBLEM_SOLVED', s."problemId", 0, MIN(s."createdAt")
FROM "Submission" s
JOIN "User" u ON u."id" = s."userId"
WHERE s."status" = 'ACCEPTED'
GROUP BY s."userId", s."problemId", u."tenantId"
ON CONFLICT ("userId", "source", "refId") DO NOTHING;

INSERT INTO "PointLedger" ("id", "userId", "tenantId", "source", "refId", "delta", "createdAt")
SELECT gen_random_uuid()::text, c."userId", u."tenantId", 'DAILY_CHALLENGE', c."dailyChallengeId", 0, c."completedAt"
FROM "DailyChallengeCompletion" c
JOIN "User" u ON u."id" = c."userId"
ON CONFLICT ("userId", "source", "refId") DO NOTHING;

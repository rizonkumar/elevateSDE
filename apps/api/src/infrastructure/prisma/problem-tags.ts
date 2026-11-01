import { Prisma } from '@prisma/client';

type RawExecutor = Pick<Prisma.TransactionClient, '$executeRaw'>;

export async function syncProblemTags(client: RawExecutor, problemIds: string[]): Promise<void> {
  if (problemIds.length === 0) {
    return;
  }
  await client.$executeRaw`
    UPDATE "Problem" AS p
    SET "tags" = COALESCE(
      (
        SELECT array_agg(t."name" ORDER BY t."name")
        FROM "ProblemTopic" pt
        JOIN "Topic" t ON t."id" = pt."topicId"
        WHERE pt."problemId" = p."id"
      ),
      ARRAY[]::text[]
    )
    WHERE p."id" = ANY(${problemIds}::text[])
  `;
}

import { PrismaClient } from '@prisma/client';

export async function seedTopicsFromTags(prisma: PrismaClient): Promise<number> {
  await prisma.$executeRaw`
    INSERT INTO "Topic" ("id", "slug", "name", "createdAt", "updatedAt")
    SELECT gen_random_uuid()::text, tagged.slug, tagged.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM (
      SELECT DISTINCT ON (slug) slug, name
      FROM (
        SELECT
          trim(both '-' from regexp_replace(lower(trim(tag)), '[^a-z0-9]+', '-', 'g')) AS slug,
          trim(tag) AS name
        FROM "Problem", unnest("tags") AS tag
      ) AS raw
      WHERE slug <> ''
      ORDER BY slug, name
    ) AS tagged
    ON CONFLICT ("slug") DO NOTHING
  `;
  return prisma.$executeRaw`
    INSERT INTO "ProblemTopic" ("problemId", "topicId")
    SELECT DISTINCT p."id", t."id"
    FROM "Problem" p, unnest(p."tags") AS tag
    JOIN "Topic" t
      ON t."slug" = trim(both '-' from regexp_replace(lower(trim(tag)), '[^a-z0-9]+', '-', 'g'))
    ON CONFLICT DO NOTHING
  `;
}

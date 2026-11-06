import { Prisma, PrismaClient } from '@prisma/client';
import { loadDatasetProblems, loadRunnableDatasetProblems } from './leetcode';

const EMPTY_HARNESS = { paramTypes: [], returnType: '', cpp: { signature: '' } };

export async function seedProblems(prisma: PrismaClient): Promise<number> {
  const problems = loadDatasetProblems();

  const rows: Prisma.ProblemCreateManyInput[] = problems.map((problem) => ({
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    description: problem.description,
    constraints: problem.constraints,
    tags: problem.tags,
    starterCode: problem.starterCode,
    examples: problem.examples as unknown as Prisma.InputJsonValue,
    functionName: problem.functionName,
    harness: EMPTY_HARNESS,
    referenceSolution: {},
    comparisonMode: 'EXACT',
    timeLimitMinutes: problem.timeLimitMinutes,
    isPublished: true,
  }));

  const chunkSize = 250;
  const chunkStarts = Array.from(
    { length: Math.ceil(rows.length / chunkSize) },
    (_, i) => i * chunkSize,
  );
  await Promise.all(
    chunkStarts.map((start) =>
      prisma.problem.createMany({
        data: rows.slice(start, start + chunkSize),
        skipDuplicates: true,
      }),
    ),
  );

  const runnableProblems = loadRunnableDatasetProblems();
  await Promise.all(
    runnableProblems.map(async (problem) => {
      const harness = (problem.harness ?? EMPTY_HARNESS) as unknown as Prisma.InputJsonValue;
      const comparisonMode = problem.comparisonMode ?? 'EXACT';
      const record = await prisma.problem.upsert({
        where: { slug: problem.slug },
        update: {
          title: problem.title,
          difficulty: problem.difficulty,
          description: problem.description,
          constraints: problem.constraints,
          tags: problem.tags,
          starterCode: problem.starterCode,
          examples: problem.examples as unknown as Prisma.InputJsonValue,
          functionName: problem.functionName,
          harness,
          comparisonMode,
          timeLimitMinutes: problem.timeLimitMinutes,
          isPublished: true,
        },
        create: {
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          description: problem.description,
          constraints: problem.constraints,
          tags: problem.tags,
          starterCode: problem.starterCode,
          examples: problem.examples as unknown as Prisma.InputJsonValue,
          functionName: problem.functionName,
          harness,
          referenceSolution: {},
          comparisonMode,
          timeLimitMinutes: problem.timeLimitMinutes,
          isPublished: true,
        },
      });
      await prisma.problemTestCase.deleteMany({ where: { problemId: record.id } });
      await prisma.problemTestCase.createMany({
        data: problem.testCases.map((testCase, index) => ({
          problemId: record.id,
          ordinal: index,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          isHidden: testCase.isHidden,
        })),
      });
    }),
  );

  return prisma.problem.count();
}

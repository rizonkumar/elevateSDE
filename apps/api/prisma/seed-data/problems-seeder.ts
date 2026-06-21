import { Prisma, PrismaClient } from '@prisma/client';
import { loadDatasetProblems } from './leetcode';

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
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    await prisma.problem.createMany({ data: chunk, skipDuplicates: true });
  }

  const withTestCases = problems.filter((problem) => problem.testCases.length > 0);
  for (const problem of withTestCases) {
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
        harness: EMPTY_HARNESS,
        referenceSolution: {},
        comparisonMode: 'EXACT',
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
  }

  return prisma.problem.count();
}

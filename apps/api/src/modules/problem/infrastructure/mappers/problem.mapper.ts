import {
  Company as PrismaCompany,
  Problem as PrismaProblem,
  ProblemCompany as PrismaProblemCompany,
  ProblemTestCase as PrismaProblemTestCase,
  ProblemTopic as PrismaProblemTopic,
  Topic as PrismaTopic,
} from '@prisma/client';
import {
  LanguageCodeMap,
  Problem,
  ProblemExample,
  ProblemCompanyRef,
  ProblemHarness,
  ProblemTopicRef,
} from '../../domain/entities/problem';
import { ProblemTestCase } from '../../domain/entities/problem-test-case';

type PrismaProblemWithTestCases = PrismaProblem & {
  testCases?: PrismaProblemTestCase[];
  topics?: (PrismaProblemTopic & { topic: PrismaTopic })[];
  companies?: (PrismaProblemCompany & { company: PrismaCompany })[];
};

function toTopicRefs(record: PrismaProblemWithTestCases): ProblemTopicRef[] {
  return (record.topics ?? [])
    .map(({ topic }) => ({ id: topic.id, slug: topic.slug, name: topic.name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function toCompanyRefs(record: PrismaProblemWithTestCases): ProblemCompanyRef[] {
  return (record.companies ?? [])
    .map(({ company, frequency }) => ({
      id: company.id,
      slug: company.slug,
      name: company.name,
      frequency,
    }))
    .sort((left, right) => right.frequency - left.frequency || left.name.localeCompare(right.name));
}

export class ProblemMapper {
  static toDomain(record: PrismaProblemWithTestCases): Problem {
    const testCases = (record.testCases ?? [])
      .map((testCase) =>
        ProblemTestCase.reconstitute({
          id: testCase.id,
          ordinal: testCase.ordinal,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          isHidden: testCase.isHidden,
        }),
      )
      .sort((left, right) => left.getOrdinal() - right.getOrdinal());

    return Problem.reconstitute({
      id: record.id,
      tenantId: record.tenantId,
      slug: record.slug,
      title: record.title,
      difficulty: record.difficulty,
      description: record.description,
      constraints: record.constraints,
      tags: record.tags,
      starterCode: record.starterCode as unknown as LanguageCodeMap,
      examples: record.examples as unknown as ProblemExample[],
      functionName: record.functionName,
      harness: record.harness as unknown as ProblemHarness,
      referenceSolution: record.referenceSolution as unknown as Partial<LanguageCodeMap>,
      comparisonMode: record.comparisonMode,
      timeLimitMinutes: record.timeLimitMinutes,
      isPublished: record.isPublished,
      testCases,
      topics: toTopicRefs(record),
      companies: toCompanyRefs(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

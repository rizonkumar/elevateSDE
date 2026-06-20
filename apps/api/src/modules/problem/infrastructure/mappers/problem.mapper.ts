import {
  Problem as PrismaProblem,
  ProblemTestCase as PrismaProblemTestCase,
} from '@prisma/client';
import {
  LanguageCodeMap,
  Problem,
  ProblemExample,
  ProblemHarness,
} from '../../domain/entities/problem';
import { ProblemTestCase } from '../../domain/entities/problem-test-case';

type PrismaProblemWithTestCases = PrismaProblem & { testCases?: PrismaProblemTestCase[] };

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
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

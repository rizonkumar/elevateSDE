import { AssessmentDifficulty, ComparisonMode } from '@prisma/client';
import { ProblemPresentationMapper } from './mappers/problem-presentation.mapper';
import { Problem } from '../domain/entities/problem';
import { ProblemTestCase } from '../domain/entities/problem-test-case';

function buildProblem(): Problem {
  return Problem.reconstitute({
    id: 'p1',
    tenantId: null,
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: AssessmentDifficulty.EASY,
    description: 'desc',
    constraints: ['c'],
    tags: ['Array'],
    starterCode: { javascript: 'js', python: 'py', cpp: 'cpp' },
    examples: [{ input: 'a', output: 'b', explanation: null }],
    functionName: 'twoSum',
    harness: { paramTypes: ['int[]'], returnType: 'int[]', cpp: { signature: 'secret' } },
    referenceSolution: { javascript: 'return secret;' },
    comparisonMode: ComparisonMode.EXACT,
    timeLimitMinutes: 30,
    isPublished: true,
    testCases: [
      ProblemTestCase.reconstitute({
        id: 'v1',
        ordinal: 0,
        input: '[1], 1',
        expectedOutput: '1',
        isHidden: false,
      }),
      ProblemTestCase.reconstitute({
        id: 'h1',
        ordinal: 1,
        input: 'secret-input',
        expectedOutput: 'secret-output',
        isHidden: true,
      }),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ProblemPresentationMapper', () => {
  it('exposes only visible test cases and omits internal fields', () => {
    const dto = ProblemPresentationMapper.toCodingProblem(buildProblem());

    expect(dto.testCases).toHaveLength(1);
    expect(dto.testCases[0]?.id).toBe('v1');
    const serialized = JSON.stringify(dto);
    expect(serialized).not.toContain('secret-input');
    expect(serialized).not.toContain('secret-output');
    expect(serialized).not.toContain('return secret;');
    expect(serialized).not.toContain('twoSum');
  });

  it('maps summary fields', () => {
    const summary = ProblemPresentationMapper.toSummary(buildProblem());
    expect(summary).toEqual({
      id: 'p1',
      title: 'Two Sum',
      difficulty: 'EASY',
      tags: ['Array'],
      timeLimitMinutes: 30,
    });
  });
});

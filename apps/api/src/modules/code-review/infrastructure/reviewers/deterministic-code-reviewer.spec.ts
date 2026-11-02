import { CodeReviewRequest } from '../../domain/interfaces/code-reviewer.interface';
import { DeterministicCodeReviewer } from './deterministic-code-reviewer';

function request(overrides: Partial<CodeReviewRequest> = {}): CodeReviewRequest {
  return {
    language: 'javascript',
    functionName: 'twoSum',
    problemTitle: 'Two Sum',
    problemDescription: '',
    constraints: [],
    code: 'function twoSum(nums, target) {\n  const seen = new Map();\n  for (const n of nums) { seen.set(n, 1); }\n  return [0, 1];\n}',
    verdict: 'ACCEPTED',
    passedCount: 3,
    totalCount: 3,
    runtimeMs: 4,
    failingVisibleCases: [],
    hiddenCasesFailed: 0,
    ...overrides,
  };
}

describe('DeterministicCodeReviewer', () => {
  const reviewer = new DeterministicCodeReviewer();

  it('estimates complexity for a clean accepted solution with no findings', () => {
    const review = reviewer.review(request());

    expect(review.timeComplexity).toBe('O(n)');
    expect(review.spaceComplexity).toBe('O(n)');
    expect(review.findings).toEqual([]);
    expect(review.summary).toContain('Accepted');
  });

  it('turns failing visible cases into edge-case issues', () => {
    const review = reviewer.review(
      request({
        verdict: 'WRONG_ANSWER',
        passedCount: 1,
        failingVisibleCases: [
          { label: 'Case 2', input: '[3,3], 6', expectedOutput: '[0,1]', actualOutput: '[0,0]' },
        ],
      }),
    );

    expect(review.findings[0]).toMatchObject({ category: 'EDGE_CASE', severity: 'ISSUE' });
    expect(review.findings[0]?.message).toContain('[3,3], 6');
  });

  it('points at hidden failures without revealing them', () => {
    const review = reviewer.review(request({ verdict: 'WRONG_ANSWER', hiddenCasesFailed: 2 }));

    expect(review.findings[0]?.message).toContain('2 hidden case(s) fail');
  });

  it('flags nested loops as a performance issue when the time limit was hit', () => {
    const review = reviewer.review(
      request({
        verdict: 'TIME_LIMIT_EXCEEDED',
        code: 'function twoSum(nums, t) { for (let a = 0; a < 9; a++) { for (let b = 0; b < 9; b++) { } } }',
      }),
    );

    expect(review.timeComplexity).toBe('O(n^2)');
    expect(review.findings.map((finding) => finding.category)).toEqual([
      'PERFORMANCE',
      'COMPLEXITY',
      'READABILITY',
    ]);
    expect(review.findings[1]?.severity).toBe('ISSUE');
  });

  it('points at leftover debug output by line', () => {
    const review = reviewer.review(
      request({ code: 'function twoSum(nums) {\n  console.log(nums);\n  return [0, 1];\n}' }),
    );

    expect(review.findings).toContainEqual(
      expect.objectContaining({ category: 'READABILITY', line: 2 }),
    );
  });
});

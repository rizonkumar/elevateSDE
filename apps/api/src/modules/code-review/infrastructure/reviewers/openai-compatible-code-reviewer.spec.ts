import { CodeReviewProviderError, parseCodeReview } from './openai-compatible-code-reviewer';

function payload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    summary: 'Clean single pass with a hash map.',
    findings: [
      {
        category: 'EDGE_CASE',
        severity: 'SUGGESTION',
        line: 3,
        message: 'Empty input returns undefined.',
        suggestion: 'Return an empty array early.',
      },
    ],
    ...overrides,
  });
}

describe('parseCodeReview', () => {
  it('accepts a well-formed review', () => {
    const review = parseCodeReview(payload(), 10);

    expect(review.timeComplexity).toBe('O(n)');
    expect(review.findings).toEqual([
      {
        category: 'EDGE_CASE',
        severity: 'SUGGESTION',
        line: 3,
        message: 'Empty input returns undefined.',
        suggestion: 'Return an empty array early.',
      },
    ]);
  });

  it('drops findings with unknown categories or severities and nulls out-of-range lines', () => {
    const review = parseCodeReview(
      payload({
        findings: [
          { category: 'SECURITY', severity: 'ISSUE', line: 1, message: 'x' },
          { category: 'COMPLEXITY', severity: 'BLOCKER', line: 1, message: 'x' },
          { category: 'COMPLEXITY', severity: 'INFO', line: 99, message: 'Line out of range' },
          { category: 'COMPLEXITY', severity: 'INFO', line: 2.5, message: 'Fractional line' },
          { category: 'READABILITY', severity: 'INFO', line: 1, message: '   ' },
        ],
      }),
      10,
    );

    expect(review.findings.map((finding) => finding.message)).toEqual([
      'Line out of range',
      'Fractional line',
    ]);
    expect(review.findings.every((finding) => finding.line === null)).toBe(true);
  });

  it('caps the number of findings and the length of their text', () => {
    const many = Array.from({ length: 15 }, () => ({
      category: 'READABILITY',
      severity: 'INFO',
      line: null,
      message: 'm'.repeat(1000),
    }));

    const review = parseCodeReview(payload({ findings: many }), 10);

    expect(review.findings).toHaveLength(10);
    expect(review.findings[0]?.message.length).toBeLessThanOrEqual(400);
  });

  it('rejects responses missing required fields', () => {
    expect(() => parseCodeReview(payload({ summary: '' }), 10)).toThrow(CodeReviewProviderError);
    expect(() => parseCodeReview(payload({ findings: 'none' }), 10)).toThrow(
      CodeReviewProviderError,
    );
    expect(() => parseCodeReview('not json', 10)).toThrow(CodeReviewProviderError);
  });
});

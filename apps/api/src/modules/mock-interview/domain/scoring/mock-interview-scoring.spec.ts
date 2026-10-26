import {
  computeCompetencies,
  computeOverallScore,
  isValidDimensionScores,
  normalizeDimensionScore,
  scoreTurn,
  severityFor,
} from './mock-interview-scoring';

const strongCoding = { problemSolving: 4, technicalDepth: 4, complexity: 4, communication: 4 };
const weakCoding = { problemSolving: 1, technicalDepth: 1, complexity: 1, communication: 1 };

describe('mock interview scoring', () => {
  it('maps the 1-4 rubric scale onto 0-100', () => {
    expect([1, 2, 3, 4].map(normalizeDimensionScore)).toEqual([0, 33, 67, 100]);
  });

  it('bands severity at 75 and 50', () => {
    expect(severityFor(75)).toBe('good');
    expect(severityFor(74)).toBe('warning');
    expect(severityFor(50)).toBe('warning');
    expect(severityFor(49)).toBe('critical');
  });

  it('accepts only integer scores for exactly the rubric keys', () => {
    expect(isValidDimensionScores('CODING', strongCoding)).toBe(true);
    expect(isValidDimensionScores('CODING', { ...strongCoding, extra: 3 })).toBe(false);
    expect(isValidDimensionScores('CODING', { ...strongCoding, complexity: 5 })).toBe(false);
    expect(isValidDimensionScores('CODING', { ...strongCoding, complexity: 2.5 })).toBe(false);
    expect(isValidDimensionScores('CODING', { ...strongCoding, complexity: '3' })).toBe(false);
    expect(isValidDimensionScores('SYSTEM_DESIGN', strongCoding)).toBe(false);
    expect(isValidDimensionScores('CODING', [4, 4, 4, 4])).toBe(false);
    expect(isValidDimensionScores('CODING', null)).toBe(false);
  });

  it('scores a turn as the mean of its normalized dimensions', () => {
    expect(scoreTurn('CODING', strongCoding)).toBe(100);
    expect(scoreTurn('CODING', { problemSolving: 4, technicalDepth: 3, complexity: 2, communication: 1 })).toBe(50);
  });

  it('averages each competency across answered turns and derives the overall score', () => {
    const competencies = computeCompetencies('CODING', [strongCoding, weakCoding]);

    expect(competencies.map(({ key, score }) => [key, score])).toEqual([
      ['problemSolving', 50],
      ['technicalDepth', 50],
      ['complexity', 50],
      ['communication', 50],
    ]);
    expect(competencies.every((item) => item.severity === 'warning')).toBe(true);
    expect(computeOverallScore(competencies)).toBe(50);
  });

  it('returns no score when nothing was answered', () => {
    expect(computeCompetencies('BEHAVIORAL', [])).toEqual([]);
    expect(computeOverallScore([])).toBeNull();
  });
});

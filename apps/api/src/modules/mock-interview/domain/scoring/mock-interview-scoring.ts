import {
  MOCK_INTERVIEW_RUBRICS,
  type InterviewCompetencyScore,
  type InterviewCompetencySeverity,
  type MockInterviewDimensionScores,
  type MockInterviewRubricDimension,
  type MockInterviewTopic,
} from '@elevatesde/shared-types';

export const MIN_DIMENSION_SCORE = 1;
export const MAX_DIMENSION_SCORE = 4;

export function rubricFor(topic: MockInterviewTopic): readonly MockInterviewRubricDimension[] {
  return MOCK_INTERVIEW_RUBRICS[topic];
}

export function severityFor(score: number): InterviewCompetencySeverity {
  if (score >= 75) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

export function normalizeDimensionScore(value: number): number {
  return Math.round(
    ((value - MIN_DIMENSION_SCORE) / (MAX_DIMENSION_SCORE - MIN_DIMENSION_SCORE)) * 100,
  );
}

export function isValidDimensionScores(
  topic: MockInterviewTopic,
  value: unknown,
): value is MockInterviewDimensionScores {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const rubric = rubricFor(topic);
  if (Object.keys(record).length !== rubric.length) return false;
  return rubric.every(({ key }) => {
    const score = record[key];
    return (
      typeof score === 'number' &&
      Number.isInteger(score) &&
      score >= MIN_DIMENSION_SCORE &&
      score <= MAX_DIMENSION_SCORE
    );
  });
}

export function scoreTurn(topic: MockInterviewTopic, scores: MockInterviewDimensionScores): number {
  const rubric = rubricFor(topic);
  const total = rubric.reduce(
    (sum, { key }) => sum + normalizeDimensionScore(scores[key] ?? MIN_DIMENSION_SCORE),
    0,
  );
  return Math.round(total / rubric.length);
}

export function computeCompetencies(
  topic: MockInterviewTopic,
  answered: readonly MockInterviewDimensionScores[],
): InterviewCompetencyScore[] {
  if (answered.length === 0) return [];
  return rubricFor(topic).map(({ key, label }) => {
    const total = answered.reduce(
      (sum, scores) => sum + normalizeDimensionScore(scores[key] ?? MIN_DIMENSION_SCORE),
      0,
    );
    const score = Math.round(total / answered.length);
    return { key, label, score, severity: severityFor(score) };
  });
}

export function computeOverallScore(competencies: readonly InterviewCompetencyScore[]): number | null {
  if (competencies.length === 0) return null;
  const total = competencies.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / competencies.length);
}

export const FINDING_CATEGORIES = [
  'COMPLEXITY',
  'READABILITY',
  'EDGE_CASE',
  'CORRECTNESS',
  'PERFORMANCE',
] as const;

export const FINDING_SEVERITIES = ['INFO', 'SUGGESTION', 'ISSUE'] as const;

export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export const MAX_FINDINGS = 10;
export const MAX_FINDING_TEXT_LENGTH = 400;
export const MAX_SUMMARY_LENGTH = 600;
export const MAX_COMPLEXITY_LENGTH = 40;
export const DAILY_REVIEW_LIMIT = 10;

export interface ReviewFinding {
  category: FindingCategory;
  severity: FindingSeverity;
  line: number | null;
  message: string;
  suggestion: string | null;
}

export interface CodeReviewResult {
  timeComplexity: string;
  spaceComplexity: string;
  summary: string;
  findings: ReviewFinding[];
}

export function isFindingCategory(value: unknown): value is FindingCategory {
  return typeof value === 'string' && (FINDING_CATEGORIES as readonly string[]).includes(value);
}

export function isFindingSeverity(value: unknown): value is FindingSeverity {
  return typeof value === 'string' && (FINDING_SEVERITIES as readonly string[]).includes(value);
}

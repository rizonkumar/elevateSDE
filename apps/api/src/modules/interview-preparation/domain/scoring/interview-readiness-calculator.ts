import type {
  InterviewReadinessFormulaVersion,
  InterviewReadinessStatus,
  InterviewRoundType,
  ReadinessEvidenceSource,
} from '@elevatesde/shared-types';

export interface ReadinessEvidenceInput {
  source: ReadinessEvidenceSource;
  score: number | null;
  weight: number;
  observedAt: Date | null;
  applicable: boolean;
  maxAgeDays?: number;
}

export interface RoundReadinessInput {
  roundId: string;
  roundType: InterviewRoundType;
  title: string;
  weight: number;
  evidence: ReadinessEvidenceInput[];
}

export interface InterviewReadinessInput {
  rounds: RoundReadinessInput[];
  calculatedAt: Date;
}

export interface CalculatedEvidence {
  source: ReadinessEvidenceSource;
  score: number | null;
  weight: number;
  freshness: number;
  stale: boolean;
}

export interface CalculatedRoundReadiness {
  roundId: string;
  roundType: InterviewRoundType;
  title: string;
  score: number | null;
  status: InterviewReadinessStatus;
  confidence: number;
  coverage: number;
  evidence: CalculatedEvidence[];
  missingEvidence: ReadinessEvidenceSource[];
}

export interface InterviewReadinessResult {
  formulaVersion: InterviewReadinessFormulaVersion;
  score: number | null;
  status: InterviewReadinessStatus;
  confidence: number;
  coverage: number;
  rounds: CalculatedRoundReadiness[];
}

const FORMULA_VERSION: InterviewReadinessFormulaVersion = 'v1';
const DEFAULT_MAX_AGE_DAYS = 90;
const MILLISECONDS_PER_DAY = 86_400_000;
const MINIMUM_MEANINGFUL_COVERAGE = 0.35;
const READY_THRESHOLD = 80;
const PROGRESSING_THRESHOLD = 60;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function assertFiniteWithin(value: number, minimum: number, maximum: number, field: string): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${field} must be between ${minimum} and ${maximum}`);
  }
}

function assertPositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${field} must be greater than zero`);
  }
}

function calculateFreshness(
  observedAt: Date | null,
  calculatedAt: Date,
  maxAgeDays: number,
): number {
  if (observedAt === null) return 0;
  const observedTime = observedAt.getTime();
  const calculatedTime = calculatedAt.getTime();
  if (!Number.isFinite(observedTime)) throw new RangeError('observedAt must be a valid date');
  if (observedTime > calculatedTime) throw new RangeError('observedAt cannot be in the future');
  const ageDays = (calculatedTime - observedTime) / MILLISECONDS_PER_DAY;
  return round(clamp(1 - ageDays / maxAgeDays, 0, 1));
}

function statusFor(score: number | null, coverage: number): InterviewReadinessStatus {
  if (score === null || coverage < MINIMUM_MEANINGFUL_COVERAGE) return 'INSUFFICIENT_EVIDENCE';
  if (score >= READY_THRESHOLD) return 'READY';
  if (score >= PROGRESSING_THRESHOLD) return 'PROGRESSING';
  return 'NEEDS_WORK';
}

function calculateRound(
  input: RoundReadinessInput,
  calculatedAt: Date,
): CalculatedRoundReadiness {
  assertPositive(input.weight, 'round weight');
  const applicable = input.evidence.filter((item) => item.applicable);
  const availableWeight = applicable.reduce((total, item) => {
    assertPositive(item.weight, 'evidence weight');
    if (item.score !== null) assertFiniteWithin(item.score, 0, 100, 'evidence score');
    return total + item.weight;
  }, 0);
  const scored = applicable.filter(
    (item): item is ReadinessEvidenceInput & { score: number; observedAt: Date } =>
      item.score !== null && item.observedAt !== null,
  );
  const scoredWeight = scored.reduce((total, item) => total + item.weight, 0);
  const coverage = availableWeight === 0 ? 0 : round(scoredWeight / availableWeight);
  const evidence = applicable.map((item) => {
    const maxAgeDays = item.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS;
    assertPositive(maxAgeDays, 'maxAgeDays');
    const freshness = calculateFreshness(item.observedAt, calculatedAt, maxAgeDays);
    return {
      source: item.source,
      score: item.score,
      weight: item.weight,
      freshness,
      stale: item.observedAt !== null && freshness === 0,
    };
  });
  const score =
    scoredWeight === 0
      ? null
      : round(scored.reduce((total, item) => total + item.score * item.weight, 0) / scoredWeight);
  const freshnessWeight = scored.reduce((total, item) => total + item.weight, 0);
  const meanFreshness =
    freshnessWeight === 0
      ? 0
      : evidence.reduce(
          (total, item) => total + (item.score === null ? 0 : item.freshness * item.weight),
          0,
        ) / freshnessWeight;
  const confidence = round(coverage * meanFreshness);
  const missingEvidence = applicable
    .filter((item) => item.score === null || item.observedAt === null)
    .map((item) => item.source);

  return {
    roundId: input.roundId,
    roundType: input.roundType,
    title: input.title,
    score,
    status: statusFor(score, coverage),
    confidence,
    coverage,
    evidence,
    missingEvidence,
  };
}

export function calculateInterviewReadinessV1(
  input: InterviewReadinessInput,
): InterviewReadinessResult {
  if (!Number.isFinite(input.calculatedAt.getTime())) {
    throw new RangeError('calculatedAt must be a valid date');
  }
  const rounds = input.rounds.map((item) => calculateRound(item, input.calculatedAt));
  const totalRoundWeight = input.rounds.reduce((total, item) => total + item.weight, 0);
  const scoredRounds = rounds
    .map((item, index) => ({ item, input: input.rounds[index] }))
    .filter(
      (entry): entry is { item: CalculatedRoundReadiness & { score: number }; input: RoundReadinessInput } =>
        entry.item.score !== null && entry.input !== undefined,
    );
  const scoredRoundWeight = scoredRounds.reduce((total, entry) => total + entry.input.weight, 0);
  const score =
    scoredRoundWeight === 0
      ? null
      : round(
          scoredRounds.reduce(
            (total, entry) => total + entry.item.score * entry.input.weight,
            0,
          ) / scoredRoundWeight,
        );
  const coverage =
    totalRoundWeight === 0
      ? 0
      : round(
          rounds.reduce((total, item, index) => {
            const configured = input.rounds[index];
            return total + item.coverage * (configured?.weight ?? 0);
          }, 0) / totalRoundWeight,
        );
  const confidence =
    totalRoundWeight === 0
      ? 0
      : round(
          rounds.reduce((total, item, index) => {
            const configured = input.rounds[index];
            return total + item.confidence * (configured?.weight ?? 0);
          }, 0) / totalRoundWeight,
        );

  return {
    formulaVersion: FORMULA_VERSION,
    score,
    status: statusFor(score, coverage),
    confidence,
    coverage,
    rounds,
  };
}

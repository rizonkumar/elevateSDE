import {
  calculateInterviewReadinessV1,
  InterviewReadinessInput,
  ReadinessEvidenceInput,
  RoundReadinessInput,
} from './interview-readiness-calculator';

const now = new Date('2026-09-30T12:00:00.000Z');

function evidence(overrides: Partial<ReadinessEvidenceInput> = {}): ReadinessEvidenceInput {
  return {
    source: 'CODING_SUBMISSIONS',
    score: 80,
    weight: 1,
    observedAt: new Date('2026-09-29T12:00:00.000Z'),
    applicable: true,
    ...overrides,
  };
}

function round(overrides: Partial<RoundReadinessInput> = {}): RoundReadinessInput {
  return {
    roundId: 'round-1',
    roundType: 'CODING',
    title: 'Coding',
    weight: 1,
    evidence: [evidence()],
    ...overrides,
  };
}

function input(rounds: RoundReadinessInput[]): InterviewReadinessInput {
  return { rounds, calculatedAt: now };
}

describe('calculateInterviewReadinessV1', () => {
  it('returns a complete versioned readiness result', () => {
    const result = calculateInterviewReadinessV1(
      input([
        round({
          evidence: [
            evidence({ score: 90, weight: 2 }),
            evidence({ source: 'TASK_COMPLETION', score: 80, weight: 1 }),
          ],
        }),
      ]),
    );

    expect(result.formulaVersion).toBe('v1');
    expect(result.score).toBeCloseTo(86.67, 2);
    expect(result.status).toBe('READY');
    expect(result.coverage).toBe(1);
    expect(result.confidence).toBeGreaterThan(0.98);
  });

  it('normalizes partial evidence without coercing missing evidence to zero', () => {
    const result = calculateInterviewReadinessV1(
      input([
        round({
          evidence: [
            evidence({ score: 75, weight: 1 }),
            evidence({ source: 'MOCK_INTERVIEW', score: null, observedAt: null, weight: 1 }),
          ],
        }),
      ]),
    );

    expect(result.score).toBe(75);
    expect(result.coverage).toBe(0.5);
    expect(result.status).toBe('PROGRESSING');
    expect(result.rounds[0]?.missingEvidence).toEqual(['MOCK_INTERVIEW']);
  });

  it('returns insufficient evidence for an empty plan', () => {
    const result = calculateInterviewReadinessV1(input([]));

    expect(result.score).toBeNull();
    expect(result.coverage).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('reduces confidence for stale evidence without changing its measured score', () => {
    const result = calculateInterviewReadinessV1(
      input([
        round({
          evidence: [
            evidence({
              score: 88,
              observedAt: new Date('2026-01-01T00:00:00.000Z'),
              maxAgeDays: 30,
            }),
          ],
        }),
      ]),
    );

    expect(result.score).toBe(88);
    expect(result.confidence).toBe(0);
    expect(result.rounds[0]?.evidence[0]?.stale).toBe(true);
  });

  it('honors custom round weights', () => {
    const result = calculateInterviewReadinessV1(
      input([
        round({ roundId: 'coding', weight: 3, evidence: [evidence({ score: 90 })] }),
        round({
          roundId: 'custom',
          roundType: 'CUSTOM',
          title: 'Product thinking',
          weight: 1,
          evidence: [evidence({ source: 'PEER_SCORECARD', score: 50 })],
        }),
      ]),
    );

    expect(result.score).toBe(80);
    expect(result.status).toBe('READY');
  });

  it.each([
    ['score', evidence({ score: 101 })],
    ['weight', evidence({ weight: 0 })],
    ['age', evidence({ maxAgeDays: 0 })],
    ['future date', evidence({ observedAt: new Date('2026-10-01T00:00:00.000Z') })],
  ])('rejects invalid %s input', (_label, invalidEvidence) => {
    expect(() =>
      calculateInterviewReadinessV1(input([round({ evidence: [invalidEvidence] })])),
    ).toThrow(RangeError);
  });

  it('does not mutate caller input', () => {
    const source = input([round()]);
    const before = source.rounds[0]?.evidence[0]?.score;

    calculateInterviewReadinessV1(source);

    expect(source.rounds[0]?.evidence[0]?.score).toBe(before);
  });
});

import { MOCK_INTERVIEW_MAX_TURNS, type InterviewConfig } from '@elevatesde/shared-types';
import {
  ANSWER_GRACE_MS,
  MockInterviewRuleError,
  MockInterviewSession,
} from './mock-interview-session';

const config: InterviewConfig = {
  topic: 'CODING',
  roleLevel: 'MID',
  companyStyle: 'GENERIC',
  durationMinutes: 20,
};
const scores = { problemSolving: 3, technicalDepth: 3, complexity: 2, communication: 4 };
const startedAt = new Date('2026-10-25T10:00:00.000Z');

function start(overrides: Partial<InterviewConfig> = {}): MockInterviewSession {
  return MockInterviewSession.start({
    userId: 'user-1',
    tenantId: null,
    config: { ...config, ...overrides },
    preparationTaskId: null,
    engine: 'LLM',
    openingQuestion: 'Design a rate limiter.',
    now: startedAt,
  });
}

function answerCurrent(session: MockInterviewSession, at: Date, engine: 'LLM' | 'DETERMINISTIC' = 'LLM'): void {
  const current = session.getCurrentTurn();
  if (!current) throw new Error('expected an open turn');
  session.recordAnswer({
    turnId: current.id,
    answer: '  I would use a token bucket per user.  ',
    dimensionScores: scores,
    feedback: 'Discuss distributed enforcement.',
    engine,
    now: at,
  });
}

describe('MockInterviewSession', () => {
  it('starts active with an opening question and a deadline from the duration', () => {
    const session = start();

    expect(session.getStatus()).toBe('ACTIVE');
    expect(session.getTurns()).toHaveLength(1);
    expect(session.getCurrentTurn()?.question).toBe('Design a rate limiter.');
    expect(session.getDeadlineAt().toISOString()).toBe('2026-10-25T10:20:00.000Z');
  });

  it('rejects unsupported durations', () => {
    expect(() => start({ durationMinutes: 7 })).toThrow(MockInterviewRuleError);
  });

  it('records a trimmed answer with its rubric score', () => {
    const session = start();
    answerCurrent(session, new Date(startedAt.getTime() + 60_000));

    const [turn] = session.getTurns();
    expect(turn?.answer).toBe('I would use a token bucket per user.');
    expect(turn?.score).toBe(67);
    expect(session.getCurrentTurn()).toBeNull();
  });

  it('only accepts an answer to the latest open question', () => {
    const session = start();
    const now = new Date(startedAt.getTime() + 60_000);

    expect(() => session.assertCanAnswer('another-turn', 'answer', now)).toThrow(
      'Only the latest question can be answered',
    );
    const current = session.getCurrentTurn();
    expect(() => session.assertCanAnswer(current?.id ?? '', '   ', now)).toThrow('Answer cannot be empty');
    expect(() => session.assertCanAnswer(current?.id ?? '', 'x'.repeat(4001), now)).toThrow(
      'at most 4000 characters',
    );
  });

  it('accepts answers within the grace period and rejects them after it', () => {
    const session = start();
    const current = session.getCurrentTurn();
    const deadline = session.getDeadlineAt().getTime();

    expect(() =>
      session.assertCanAnswer(current?.id ?? '', 'answer', new Date(deadline + ANSWER_GRACE_MS)),
    ).not.toThrow();
    expect(() =>
      session.assertCanAnswer(current?.id ?? '', 'answer', new Date(deadline + ANSWER_GRACE_MS + 1)),
    ).toThrow('The interview time is over');
  });

  it('asks follow-ups until the question cap', () => {
    const session = start();
    const now = new Date(startedAt.getTime() + 60_000);
    for (let index = 1; index < MOCK_INTERVIEW_MAX_TURNS; index += 1) {
      answerCurrent(session, now);
      expect(session.shouldConcludeAfterCurrentAnswer(now)).toBe(false);
      session.askNext(`Follow-up ${index}`, now, 'LLM');
    }

    expect(session.getTurns()).toHaveLength(MOCK_INTERVIEW_MAX_TURNS);
    expect(session.shouldConcludeAfterCurrentAnswer(now)).toBe(true);
    answerCurrent(session, now);
    expect(() => session.askNext('One more', now, 'LLM')).toThrow('question limit');
  });

  it('refuses a follow-up while the current question is open', () => {
    const session = start();

    expect(() => session.askNext('Next', startedAt, 'LLM')).toThrow('has not been answered');
  });

  it('downgrades the engine when any turn used the deterministic fallback', () => {
    const session = start();
    answerCurrent(session, startedAt, 'DETERMINISTIC');

    expect(session.getEngine()).toBe('DETERMINISTIC');
    session.askNext('Next', startedAt, 'LLM');
    expect(session.getEngine()).toBe('DETERMINISTIC');
  });

  it('moves to scoring when concluded with answers and abandons otherwise', () => {
    const answered = start();
    answerCurrent(answered, startedAt);
    const unanswered = start();

    expect(answered.conclude(startedAt)).toBe('SCORING');
    expect(unanswered.conclude(startedAt)).toBe('ABANDONED');
    expect(answered.getEndedAt()).toEqual(startedAt);
    expect(() => answered.conclude(startedAt)).toThrow('no longer active');
  });

  it('completes only from scoring', () => {
    const session = start();
    const report = { overallScore: 70, competencies: [], strengths: [], improvements: [], summary: 'ok' };

    expect(() => session.complete(report)).toThrow(MockInterviewRuleError);
    answerCurrent(session, startedAt);
    session.conclude(startedAt);
    session.complete(report);
    expect(session.getStatus()).toBe('COMPLETED');
    expect(session.getReport()).toEqual(report);
  });

  it('restores an independent copy of persisted state', () => {
    const session = start();
    const restored = MockInterviewSession.restore(session.toState());
    answerCurrent(restored, startedAt);

    expect(session.getCurrentTurn()).not.toBeNull();
    expect(restored.getCurrentTurn()).toBeNull();
  });
});

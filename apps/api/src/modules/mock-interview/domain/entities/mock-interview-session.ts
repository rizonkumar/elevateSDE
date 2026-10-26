import { randomUUID } from 'crypto';
import {
  MOCK_INTERVIEW_DURATIONS,
  MOCK_INTERVIEW_MAX_ANSWER_LENGTH,
  MOCK_INTERVIEW_MAX_TURNS,
  type InterviewConfig,
  type MockInterviewDimensionScores,
  type MockInterviewEngine,
  type MockInterviewFeedback,
  type MockInterviewSessionStatus,
} from '@elevatesde/shared-types';
import { scoreTurn } from '../scoring/mock-interview-scoring';

export const ANSWER_GRACE_MS = 30_000;

export class MockInterviewRuleError extends Error {}

export interface MockInterviewTurnState {
  id: string;
  ordinal: number;
  question: string;
  askedAt: Date;
  answer: string | null;
  answeredAt: Date | null;
  dimensionScores: MockInterviewDimensionScores | null;
  score: number | null;
  feedback: string | null;
}

export interface MockInterviewSessionState {
  id: string;
  userId: string;
  tenantId: string | null;
  config: InterviewConfig;
  status: MockInterviewSessionStatus;
  engine: MockInterviewEngine;
  preparationTaskId: string | null;
  startedAt: Date;
  deadlineAt: Date;
  endedAt: Date | null;
  report: MockInterviewFeedback | null;
  failureReason: string | null;
  version: number;
  turns: MockInterviewTurnState[];
}

export interface StartMockInterviewInput {
  userId: string;
  tenantId: string | null;
  config: InterviewConfig;
  preparationTaskId: string | null;
  engine: MockInterviewEngine;
  openingQuestion: string;
  now: Date;
}

export interface RecordAnswerInput {
  turnId: string;
  answer: string;
  dimensionScores: MockInterviewDimensionScores;
  feedback: string;
  engine: MockInterviewEngine;
  now: Date;
}

export class MockInterviewSession {
  private constructor(private state: MockInterviewSessionState) {}

  static start(input: StartMockInterviewInput): MockInterviewSession {
    if (!MOCK_INTERVIEW_DURATIONS.includes(input.config.durationMinutes)) {
      throw new MockInterviewRuleError('Unsupported interview duration');
    }
    return new MockInterviewSession({
      id: randomUUID(),
      userId: input.userId,
      tenantId: input.tenantId,
      config: { ...input.config },
      status: 'ACTIVE',
      engine: input.engine,
      preparationTaskId: input.preparationTaskId,
      startedAt: input.now,
      deadlineAt: new Date(input.now.getTime() + input.config.durationMinutes * 60_000),
      endedAt: null,
      report: null,
      failureReason: null,
      version: 0,
      turns: [MockInterviewSession.newTurn(0, input.openingQuestion, input.now)],
    });
  }

  static restore(state: MockInterviewSessionState): MockInterviewSession {
    return new MockInterviewSession({ ...state, turns: state.turns.map((turn) => ({ ...turn })) });
  }

  private static newTurn(ordinal: number, question: string, now: Date): MockInterviewTurnState {
    return {
      id: randomUUID(),
      ordinal,
      question,
      askedAt: now,
      answer: null,
      answeredAt: null,
      dimensionScores: null,
      score: null,
      feedback: null,
    };
  }

  getId(): string {
    return this.state.id;
  }

  getUserId(): string {
    return this.state.userId;
  }

  getConfig(): InterviewConfig {
    return this.state.config;
  }

  getStatus(): MockInterviewSessionStatus {
    return this.state.status;
  }

  getEngine(): MockInterviewEngine {
    return this.state.engine;
  }

  getPreparationTaskId(): string | null {
    return this.state.preparationTaskId;
  }

  getVersion(): number {
    return this.state.version;
  }

  getReport(): MockInterviewFeedback | null {
    return this.state.report;
  }

  getStartedAt(): Date {
    return this.state.startedAt;
  }

  getDeadlineAt(): Date {
    return this.state.deadlineAt;
  }

  getEndedAt(): Date | null {
    return this.state.endedAt;
  }

  getFailureReason(): string | null {
    return this.state.failureReason;
  }

  markSaved(): void {
    this.state.version += 1;
  }

  getTurns(): readonly MockInterviewTurnState[] {
    return this.state.turns;
  }

  getAnsweredTurns(): Array<MockInterviewTurnState & { answer: string; dimensionScores: MockInterviewDimensionScores }> {
    return this.state.turns.filter(
      (turn): turn is MockInterviewTurnState & { answer: string; dimensionScores: MockInterviewDimensionScores } =>
        turn.answer !== null && turn.dimensionScores !== null,
    );
  }

  getCurrentTurn(): MockInterviewTurnState | null {
    const last = this.state.turns.at(-1);
    return last && last.answer === null ? last : null;
  }

  toState(): MockInterviewSessionState {
    return { ...this.state, turns: this.state.turns.map((turn) => ({ ...turn })) };
  }

  isExpired(now: Date): boolean {
    return now.getTime() > this.state.deadlineAt.getTime() + ANSWER_GRACE_MS;
  }

  isOverdueBy(now: Date, graceMs: number): boolean {
    return now.getTime() > this.state.deadlineAt.getTime() + graceMs;
  }

  shouldConcludeAfterCurrentAnswer(now: Date): boolean {
    return (
      this.state.turns.length >= MOCK_INTERVIEW_MAX_TURNS ||
      now.getTime() >= this.state.deadlineAt.getTime()
    );
  }

  assertCanAnswer(turnId: string, answer: string, now: Date): void {
    if (this.state.status !== 'ACTIVE') {
      throw new MockInterviewRuleError('This interview is no longer active');
    }
    if (this.isExpired(now)) {
      throw new MockInterviewRuleError('The interview time is over');
    }
    const current = this.getCurrentTurn();
    if (!current || current.id !== turnId) {
      throw new MockInterviewRuleError('Only the latest question can be answered');
    }
    const trimmed = answer.trim();
    if (trimmed.length === 0) {
      throw new MockInterviewRuleError('Answer cannot be empty');
    }
    if (trimmed.length > MOCK_INTERVIEW_MAX_ANSWER_LENGTH) {
      throw new MockInterviewRuleError(
        `Answer must be at most ${MOCK_INTERVIEW_MAX_ANSWER_LENGTH} characters`,
      );
    }
  }

  recordAnswer(input: RecordAnswerInput): void {
    this.assertCanAnswer(input.turnId, input.answer, input.now);
    const current = this.getCurrentTurn();
    if (!current) throw new MockInterviewRuleError('Only the latest question can be answered');
    current.answer = input.answer.trim();
    current.answeredAt = input.now;
    current.dimensionScores = { ...input.dimensionScores };
    current.score = scoreTurn(this.state.config.topic, input.dimensionScores);
    current.feedback = input.feedback;
    this.markEngine(input.engine);
  }

  askNext(question: string, now: Date, engine: MockInterviewEngine): void {
    if (this.state.status !== 'ACTIVE') {
      throw new MockInterviewRuleError('This interview is no longer active');
    }
    if (this.getCurrentTurn()) {
      throw new MockInterviewRuleError('The current question has not been answered');
    }
    if (this.state.turns.length >= MOCK_INTERVIEW_MAX_TURNS) {
      throw new MockInterviewRuleError('The interview has reached its question limit');
    }
    this.state.turns.push(MockInterviewSession.newTurn(this.state.turns.length, question, now));
    this.markEngine(engine);
  }

  conclude(now: Date): 'SCORING' | 'ABANDONED' {
    if (this.state.status !== 'ACTIVE') {
      throw new MockInterviewRuleError('This interview is no longer active');
    }
    this.state.endedAt = now;
    this.state.status = this.getAnsweredTurns().length > 0 ? 'SCORING' : 'ABANDONED';
    return this.state.status;
  }

  complete(report: MockInterviewFeedback): void {
    if (this.state.status !== 'SCORING') {
      throw new MockInterviewRuleError('Only an interview being scored can be completed');
    }
    this.state.report = report;
    this.state.status = 'COMPLETED';
    this.state.failureReason = null;
  }

  fail(reason: string): void {
    if (this.state.status !== 'SCORING') {
      throw new MockInterviewRuleError('Only an interview being scored can fail');
    }
    this.state.status = 'FAILED';
    this.state.failureReason = reason;
  }

  private markEngine(engine: MockInterviewEngine): void {
    if (engine === 'DETERMINISTIC') this.state.engine = 'DETERMINISTIC';
  }
}

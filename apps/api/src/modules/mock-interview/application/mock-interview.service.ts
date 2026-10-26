import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { InterviewConfig, MockInterviewHistoryDto } from '@elevatesde/shared-types';
import { IMockInterviewScoringQueue } from '../../queues/domain/interfaces/mock-interview-scoring-queue.interface';
import {
  MockInterviewRuleError,
  MockInterviewSession,
} from '../domain/entities/mock-interview-session';
import {
  MOCK_INTERVIEW_EVENTS,
  MockInterviewCompletedEvent,
} from '../domain/events/mock-interview-events';
import { IMockInterviewRepository } from '../domain/interfaces/mock-interview-repository.interface';
import {
  IMockInterviewer,
  MockInterviewSummaryRequest,
} from '../domain/interfaces/mock-interviewer.interface';
import {
  computeCompetencies,
  computeOverallScore,
} from '../domain/scoring/mock-interview-scoring';

const DEFAULT_DAILY_LIMIT = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_PAGE_SIZE = 20;
const ABANDON_AFTER_DEADLINE_MS = 15 * 60 * 1000;
const RESCORE_AFTER_MS = 5 * 60 * 1000;
const SWEEP_BATCH_SIZE = 100;
const SCORING_FAILURE_MESSAGE = 'We could not score this interview. Please try another session.';

export interface StartMockInterviewCommand {
  userId: string;
  tenantId: string | null;
  config: InterviewConfig;
  preparationTaskId: string | null;
}

export interface AnswerMockInterviewCommand {
  userId: string;
  sessionId: string;
  turnId: string;
  answer: string;
  version: number;
}

export function readDailyLimit(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number.parseInt(env.MOCK_INTERVIEW_DAILY_LIMIT ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT;
}

@Injectable()
export class MockInterviewService {
  private readonly logger = new Logger(MockInterviewService.name);

  constructor(
    private readonly repository: IMockInterviewRepository,
    private readonly interviewer: IMockInterviewer,
    private readonly scoringQueue: IMockInterviewScoringQueue,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async start(command: StartMockInterviewCommand): Promise<MockInterviewSession> {
    const now = new Date();
    await this.concludeIfExpired(await this.repository.findActiveForUser(command.userId), now);
    const active = await this.repository.findActiveForUser(command.userId);
    if (active) throw this.activeSessionConflict(active.getId());
    const startedToday = await this.repository.countStartedSince(
      command.userId,
      new Date(now.getTime() - DAY_MS),
    );
    if (startedToday >= readDailyLimit()) {
      throw new HttpException(
        'You have reached the daily mock interview limit. Try again tomorrow.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (
      command.preparationTaskId &&
      !(await this.repository.isOwnedMockInterviewTask(command.userId, command.preparationTaskId))
    ) {
      throw new NotFoundException('Preparation task not found');
    }
    const opening = await this.interviewer.openingQuestion(command.config);
    const preferred = this.interviewer.preferredEngine();
    const session = this.applyRules(() =>
      MockInterviewSession.start({
        userId: command.userId,
        tenantId: command.tenantId,
        config: command.config,
        preparationTaskId: command.preparationTaskId,
        engine: opening.engine === 'DETERMINISTIC' ? 'DETERMINISTIC' : preferred,
        openingQuestion: opening.value,
        now,
      }),
    );
    const created = await this.repository.createIfNoActive(session);
    if (created === 'ACTIVE_EXISTS') {
      const existing = await this.repository.findActiveForUser(command.userId);
      throw this.activeSessionConflict(existing?.getId() ?? null);
    }
    return session;
  }

  async answer(command: AnswerMockInterviewCommand): Promise<MockInterviewSession> {
    const session = await this.findOwned(command.userId, command.sessionId);
    if (session.getVersion() !== command.version) {
      throw new ConflictException('This interview changed in another tab; refresh and retry');
    }
    const now = new Date();
    if (session.getStatus() === 'ACTIVE' && session.isExpired(now)) {
      await this.concludeAndPersist(session, now);
      return session;
    }
    this.applyRules(() => session.assertCanAnswer(command.turnId, command.answer, now));
    const current = session.getCurrentTurn();
    if (!current) throw new BadRequestException('Only the latest question can be answered');
    const askFollowUp = !session.shouldConcludeAfterCurrentAnswer(now);
    const evaluation = await this.interviewer.evaluate({
      config: session.getConfig(),
      history: session.getAnsweredTurns().map(({ question, answer }) => ({ question, answer })),
      question: current.question,
      answer: command.answer.trim(),
      askFollowUp,
    });
    this.applyRules(() =>
      session.recordAnswer({
        turnId: command.turnId,
        answer: command.answer,
        dimensionScores: evaluation.value.dimensionScores,
        feedback: evaluation.value.feedback,
        engine: evaluation.engine,
        now,
      }),
    );
    const nextQuestion = evaluation.value.nextQuestion;
    if (askFollowUp && nextQuestion) {
      this.applyRules(() => session.askNext(nextQuestion, now, evaluation.engine));
      await this.persist(session);
      return session;
    }
    await this.concludeAndPersist(session, now);
    return session;
  }

  async end(userId: string, sessionId: string): Promise<MockInterviewSession> {
    const session = await this.findOwned(userId, sessionId);
    if (session.getStatus() !== 'ACTIVE') return session;
    await this.concludeAndPersist(session, new Date());
    return session;
  }

  async get(userId: string, sessionId: string): Promise<MockInterviewSession> {
    return this.findOwned(userId, sessionId);
  }

  async getActive(userId: string): Promise<MockInterviewSession | null> {
    const active = await this.repository.findActiveForUser(userId);
    if (!active) return null;
    if (await this.concludeIfExpired(active, new Date())) return null;
    return active;
  }

  list(userId: string, cursor: string | null): Promise<MockInterviewHistoryDto> {
    return this.repository.listForUser(userId, HISTORY_PAGE_SIZE, cursor);
  }

  async finalize(sessionId: string): Promise<void> {
    const session = await this.repository.findById(sessionId);
    if (!session || session.getStatus() !== 'SCORING') return;
    const request = this.summaryRequest(session);
    if (!request) {
      session.fail(SCORING_FAILURE_MESSAGE);
      await this.persist(session);
      return;
    }
    const narrative = await this.interviewer.summarize(request);
    await this.completeWith(session, request, narrative.value);
  }

  async finalizeDeterministically(sessionId: string): Promise<void> {
    const session = await this.repository.findById(sessionId);
    if (!session || session.getStatus() !== 'SCORING') return;
    const request = this.summaryRequest(session);
    try {
      if (!request) throw new Error('No answered turns to score');
      await this.completeWith(session, request, this.interviewer.summarizeDeterministically(request));
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Deterministic scoring failed for ${sessionId}: ${reason}`);
      const latest = await this.repository.findById(sessionId);
      if (!latest || latest.getStatus() !== 'SCORING') return;
      latest.fail(SCORING_FAILURE_MESSAGE);
      await this.repository.save(latest);
    }
  }

  async sweep(now: Date = new Date()): Promise<number> {
    const overdue = await this.repository.findOverdueActiveIds(
      new Date(now.getTime() - ABANDON_AFTER_DEADLINE_MS),
      SWEEP_BATCH_SIZE,
    );
    let affected = 0;
    for (const id of overdue) {
      const session = await this.repository.findById(id);
      if (!session || session.getStatus() !== 'ACTIVE') continue;
      try {
        await this.concludeAndPersist(session, now);
        affected += 1;
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(`Could not conclude overdue mock interview ${id}: ${reason}`);
      }
    }
    const stale = await this.repository.findStaleScoringIds(
      new Date(now.getTime() - RESCORE_AFTER_MS),
      SWEEP_BATCH_SIZE,
    );
    for (const id of stale) {
      await this.scoringQueue.enqueue({ sessionId: id });
      affected += 1;
    }
    return affected;
  }

  private summaryRequest(session: MockInterviewSession): MockInterviewSummaryRequest | null {
    const answered = session.getAnsweredTurns();
    const competencies = computeCompetencies(
      session.getConfig().topic,
      answered.map((turn) => turn.dimensionScores),
    );
    const overallScore = computeOverallScore(competencies);
    if (overallScore === null) return null;
    return {
      config: session.getConfig(),
      exchanges: answered.map((turn) => ({
        question: turn.question,
        answer: turn.answer,
        score: turn.score ?? 0,
        feedback: turn.feedback ?? '',
      })),
      competencies,
      overallScore,
    };
  }

  private async completeWith(
    session: MockInterviewSession,
    request: MockInterviewSummaryRequest,
    narrative: { summary: string; strengths: string[]; improvements: string[] },
  ): Promise<void> {
    session.complete({
      overallScore: request.overallScore,
      competencies: [...request.competencies],
      strengths: narrative.strengths,
      improvements: narrative.improvements,
      summary: narrative.summary,
    });
    const saved = await this.repository.save(session);
    if (saved === 'VERSION_CONFLICT') return;
    session.markSaved();
    this.eventEmitter.emit(MOCK_INTERVIEW_EVENTS.COMPLETED, {
      userId: session.getUserId(),
      sessionId: session.getId(),
      topic: session.getConfig().topic,
      overallScore: request.overallScore,
      preparationTaskId: session.getPreparationTaskId(),
    } satisfies MockInterviewCompletedEvent);
  }

  private async concludeIfExpired(
    session: MockInterviewSession | null,
    now: Date,
  ): Promise<boolean> {
    if (!session || session.getStatus() !== 'ACTIVE' || !session.isExpired(now)) return false;
    await this.concludeAndPersist(session, now);
    return true;
  }

  private async concludeAndPersist(session: MockInterviewSession, now: Date): Promise<void> {
    const outcome = this.applyRules(() => session.conclude(now));
    await this.persist(session);
    if (outcome === 'SCORING') await this.enqueueScoring(session.getId());
  }

  private async enqueueScoring(sessionId: string): Promise<void> {
    try {
      await this.scoringQueue.enqueue({ sessionId });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Failed to enqueue scoring for ${sessionId}; the sweep will retry: ${reason}`);
    }
  }

  private async persist(session: MockInterviewSession): Promise<void> {
    const saved = await this.repository.save(session);
    if (saved === 'VERSION_CONFLICT') {
      throw new ConflictException('This interview changed in another tab; refresh and retry');
    }
    session.markSaved();
  }

  private async findOwned(userId: string, sessionId: string): Promise<MockInterviewSession> {
    const session = await this.repository.findOwned(userId, sessionId);
    if (!session) throw new NotFoundException('Mock interview not found');
    return session;
  }

  private activeSessionConflict(activeSessionId: string | null): ConflictException {
    return new ConflictException({
      message: 'You already have a mock interview in progress',
      activeSessionId,
    });
  }

  private applyRules<T>(action: () => T): T {
    try {
      return action();
    } catch (error) {
      if (error instanceof MockInterviewRuleError) throw new BadRequestException(error.message);
      throw error;
    }
  }
}

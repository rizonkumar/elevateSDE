import { BadRequestException, ConflictException, HttpException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { InterviewConfig, MockInterviewEngine } from '@elevatesde/shared-types';
import { IMockInterviewScoringQueue } from '../../queues/domain/interfaces/mock-interview-scoring-queue.interface';
import { MockInterviewSession } from '../domain/entities/mock-interview-session';
import { MOCK_INTERVIEW_EVENTS } from '../domain/events/mock-interview-events';
import {
  IMockInterviewRepository,
  MockInterviewHistoryPage,
} from '../domain/interfaces/mock-interview-repository.interface';
import {
  IMockInterviewer,
  InterviewerResult,
  MockInterviewEvaluation,
  MockInterviewEvaluationRequest,
  MockInterviewNarrative,
  MockInterviewSummaryRequest,
} from '../domain/interfaces/mock-interviewer.interface';
import { MockInterviewService } from './mock-interview.service';

const config: InterviewConfig = {
  topic: 'CODING',
  roleLevel: 'MID',
  companyStyle: 'GENERIC',
  durationMinutes: 20,
};

class InMemoryMockInterviewRepository implements IMockInterviewRepository {
  readonly sessions = new Map<string, ReturnType<MockInterviewSession['toState']>>();
  ownedTasks = new Set<string>();
  startedSince = 0;

  private load(id: string): MockInterviewSession | null {
    const state = this.sessions.get(id);
    return state ? MockInterviewSession.restore(state) : null;
  }

  findById(id: string): Promise<MockInterviewSession | null> {
    return Promise.resolve(this.load(id));
  }

  findOwned(userId: string, id: string): Promise<MockInterviewSession | null> {
    const session = this.load(id);
    return Promise.resolve(session && session.getUserId() === userId ? session : null);
  }

  findActiveForUser(userId: string): Promise<MockInterviewSession | null> {
    const state = [...this.sessions.values()].find(
      (item) => item.userId === userId && item.status === 'ACTIVE',
    );
    return Promise.resolve(state ? MockInterviewSession.restore(state) : null);
  }

  countStartedSince(): Promise<number> {
    return Promise.resolve(this.startedSince);
  }

  isOwnedMockInterviewTask(_userId: string, taskId: string): Promise<boolean> {
    return Promise.resolve(this.ownedTasks.has(taskId));
  }

  async createIfNoActive(session: MockInterviewSession): Promise<'CREATED' | 'ACTIVE_EXISTS'> {
    if (await this.findActiveForUser(session.getUserId())) return 'ACTIVE_EXISTS';
    this.sessions.set(session.getId(), session.toState());
    return 'CREATED';
  }

  save(session: MockInterviewSession): Promise<'SAVED' | 'VERSION_CONFLICT'> {
    const stored = this.sessions.get(session.getId());
    if (!stored || stored.version !== session.getVersion()) return Promise.resolve('VERSION_CONFLICT');
    this.sessions.set(session.getId(), { ...session.toState(), version: stored.version + 1 });
    return Promise.resolve('SAVED');
  }

  listForUser(): Promise<MockInterviewHistoryPage> {
    return Promise.resolve({ items: [], nextCursor: null });
  }

  findOverdueActiveIds(deadlineBefore: Date): Promise<string[]> {
    return Promise.resolve(
      [...this.sessions.values()]
        .filter((item) => item.status === 'ACTIVE' && item.deadlineAt < deadlineBefore)
        .map((item) => item.id),
    );
  }

  findStaleScoringIds(endedBefore: Date): Promise<string[]> {
    return Promise.resolve(
      [...this.sessions.values()]
        .filter((item) => item.status === 'SCORING' && item.endedAt !== null && item.endedAt < endedBefore)
        .map((item) => item.id),
    );
  }
}

class StubInterviewer implements IMockInterviewer {
  engine: MockInterviewEngine = 'LLM';
  evaluateEngine: MockInterviewEngine = 'LLM';
  readonly evaluations: MockInterviewEvaluationRequest[] = [];
  summarizeError: Error | null = null;

  preferredEngine(): MockInterviewEngine {
    return this.engine;
  }

  openingQuestion(): Promise<InterviewerResult<string>> {
    return Promise.resolve({ value: 'Design a rate limiter.', engine: this.engine });
  }

  evaluate(request: MockInterviewEvaluationRequest): Promise<InterviewerResult<MockInterviewEvaluation>> {
    this.evaluations.push(request);
    return Promise.resolve({
      value: {
        dimensionScores: { problemSolving: 4, technicalDepth: 3, complexity: 3, communication: 4 },
        feedback: 'Good structure.',
        nextQuestion: request.askFollowUp ? `Follow-up ${this.evaluations.length}` : null,
      },
      engine: this.evaluateEngine,
    });
  }

  summarize(request: MockInterviewSummaryRequest): Promise<InterviewerResult<MockInterviewNarrative>> {
    if (this.summarizeError) return Promise.reject(this.summarizeError);
    return Promise.resolve({ value: this.summarizeDeterministically(request), engine: 'LLM' });
  }

  summarizeDeterministically(request: MockInterviewSummaryRequest): MockInterviewNarrative {
    return { summary: `Scored ${request.overallScore}`, strengths: ['s'], improvements: ['i'] };
  }
}

function build(): {
  service: MockInterviewService;
  repository: InMemoryMockInterviewRepository;
  interviewer: StubInterviewer;
  queue: { enqueue: jest.Mock };
  emitter: { emit: jest.Mock };
} {
  const repository = new InMemoryMockInterviewRepository();
  const interviewer = new StubInterviewer();
  const queue = { enqueue: jest.fn().mockResolvedValue(undefined) };
  const emitter = { emit: jest.fn() };
  const service = new MockInterviewService(
    repository,
    interviewer,
    queue as unknown as IMockInterviewScoringQueue,
    emitter as unknown as EventEmitter2,
  );
  return { service, repository, interviewer, queue, emitter };
}

function startCommand(overrides: { preparationTaskId?: string | null } = {}) {
  return {
    userId: 'user-1',
    tenantId: 'tenant-1',
    config,
    preparationTaskId: overrides.preparationTaskId ?? null,
  };
}

async function answerCurrent(
  service: MockInterviewService,
  session: MockInterviewSession,
): Promise<MockInterviewSession> {
  const turn = session.getCurrentTurn();
  if (!turn) throw new Error('expected an open turn');
  return service.answer({
    userId: 'user-1',
    sessionId: session.getId(),
    turnId: turn.id,
    answer: 'A token bucket per key in Redis.',
    version: session.getVersion(),
  });
}

describe('MockInterviewService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('start', () => {
    it('persists an active session with the opening question', async () => {
      const { service, repository } = build();

      const session = await service.start(startCommand());

      expect(session.getStatus()).toBe('ACTIVE');
      expect(session.getEngine()).toBe('LLM');
      expect(repository.sessions.get(session.getId())?.turns[0]?.question).toBe('Design a rate limiter.');
    });

    it('rejects a second session while one is in progress', async () => {
      const { service } = build();
      const first = await service.start(startCommand());

      const attempt = service.start(startCommand());

      await expect(attempt).rejects.toBeInstanceOf(ConflictException);
      await expect(service.start(startCommand())).rejects.toMatchObject({
        response: { activeSessionId: first.getId() },
      });
    });

    it('concludes an expired active session before starting a new one', async () => {
      const { service, repository } = build();
      const stale = await service.start(startCommand());
      const stored = repository.sessions.get(stale.getId());
      if (!stored) throw new Error('missing session');
      repository.sessions.set(stale.getId(), { ...stored, deadlineAt: new Date(Date.now() - 60 * 60_000) });

      const fresh = await service.start(startCommand());

      expect(fresh.getId()).not.toBe(stale.getId());
      expect(repository.sessions.get(stale.getId())?.status).toBe('ABANDONED');
    });

    it('enforces the daily limit', async () => {
      const { service, repository } = build();
      repository.startedSince = 10;

      await expect(service.start(startCommand())).rejects.toBeInstanceOf(HttpException);
      await expect(service.start(startCommand())).rejects.toMatchObject({ status: 429 });
    });

    it('rejects a preparation task the user does not own', async () => {
      const { service, repository } = build();
      repository.ownedTasks.add('task-1');

      await expect(service.start(startCommand({ preparationTaskId: 'task-2' }))).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.start(startCommand({ preparationTaskId: 'task-1' }))).resolves.toBeDefined();
    });

    it('records a deterministic engine when the opening question fell back', async () => {
      const { service, interviewer } = build();
      interviewer.engine = 'DETERMINISTIC';

      const session = await service.start(startCommand());

      expect(session.getEngine()).toBe('DETERMINISTIC');
    });
  });

  describe('answer', () => {
    it('scores the answer and asks the follow-up with prior history', async () => {
      const { service, interviewer } = build();
      const started = await service.start(startCommand());

      const afterFirst = await answerCurrent(service, started);
      const afterSecond = await answerCurrent(service, afterFirst);

      expect(afterSecond.getTurns()).toHaveLength(3);
      expect(afterSecond.getTurns()[0]?.score).toBe(84);
      expect(afterSecond.getCurrentTurn()?.question).toBe('Follow-up 2');
      expect(interviewer.evaluations[1]?.history).toEqual([
        { question: 'Design a rate limiter.', answer: 'A token bucket per key in Redis.' },
      ]);
      expect(afterSecond.getVersion()).toBe(2);
    });

    it('rejects a stale version without calling the interviewer', async () => {
      const { service, interviewer } = build();
      const started = await service.start(startCommand());
      const turn = started.getCurrentTurn();

      await expect(
        service.answer({
          userId: 'user-1',
          sessionId: started.getId(),
          turnId: turn?.id ?? '',
          answer: 'answer',
          version: 5,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(interviewer.evaluations).toHaveLength(0);
    });

    it('rejects answers to an old turn', async () => {
      const { service } = build();
      const started = await service.start(startCommand());
      const oldTurnId = started.getCurrentTurn()?.id ?? '';
      const next = await answerCurrent(service, started);

      await expect(
        service.answer({
          userId: 'user-1',
          sessionId: next.getId(),
          turnId: oldTurnId,
          answer: 'again',
          version: next.getVersion(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('hides other users sessions', async () => {
      const { service } = build();
      const started = await service.start(startCommand());

      await expect(service.get('user-2', started.getId())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('moves to scoring after the final answer past the deadline', async () => {
      const { service, repository, queue, interviewer } = build();
      const started = await service.start(startCommand());
      const stored = repository.sessions.get(started.getId());
      if (!stored) throw new Error('missing session');
      repository.sessions.set(started.getId(), { ...stored, deadlineAt: new Date(Date.now() - 1_000) });
      const reloaded = await service.get('user-1', started.getId());

      const result = await answerCurrent(service, reloaded);

      expect(interviewer.evaluations[0]?.askFollowUp).toBe(false);
      expect(result.getStatus()).toBe('SCORING');
      expect(queue.enqueue).toHaveBeenCalledWith({ sessionId: started.getId() });
    });

    it('concludes instead of scoring an answer submitted after the grace period', async () => {
      const { service, repository, interviewer } = build();
      const started = await service.start(startCommand());
      const stored = repository.sessions.get(started.getId());
      if (!stored) throw new Error('missing session');
      repository.sessions.set(started.getId(), { ...stored, deadlineAt: new Date(Date.now() - 5 * 60_000) });
      const reloaded = await service.get('user-1', started.getId());

      const result = await answerCurrent(service, reloaded);

      expect(result.getStatus()).toBe('ABANDONED');
      expect(interviewer.evaluations).toHaveLength(0);
    });

    it('keeps the session when enqueueing the scoring job fails', async () => {
      const { service, queue } = build();
      queue.enqueue.mockRejectedValueOnce(new Error('redis down'));
      const started = await service.start(startCommand());
      const answered = await answerCurrent(service, started);

      const ended = await service.end('user-1', answered.getId());

      expect(ended.getStatus()).toBe('SCORING');
    });
  });

  describe('finalize', () => {
    async function scoringSession(build_: ReturnType<typeof build>): Promise<MockInterviewSession> {
      const started = await build_.service.start(startCommand({ preparationTaskId: null }));
      const answered = await answerCurrent(build_.service, started);
      return build_.service.end('user-1', answered.getId());
    }

    it('completes with computed scores and emits the completion event', async () => {
      const context = build();
      const session = await scoringSession(context);

      await context.service.finalize(session.getId());

      const stored = context.repository.sessions.get(session.getId());
      expect(stored?.status).toBe('COMPLETED');
      expect(stored?.report?.overallScore).toBe(84);
      expect(stored?.report?.summary).toBe('Scored 84');
      expect(context.emitter.emit).toHaveBeenCalledWith(MOCK_INTERVIEW_EVENTS.COMPLETED, {
        userId: 'user-1',
        sessionId: session.getId(),
        topic: 'CODING',
        overallScore: 84,
        preparationTaskId: null,
      });
    });

    it('is idempotent once completed', async () => {
      const context = build();
      const session = await scoringSession(context);

      await context.service.finalize(session.getId());
      await context.service.finalize(session.getId());

      expect(context.emitter.emit).toHaveBeenCalledTimes(1);
    });

    it('completes with a deterministic summary after retries are exhausted', async () => {
      const context = build();
      const session = await scoringSession(context);
      context.interviewer.summarizeError = new Error('provider down');
      await expect(context.service.finalize(session.getId())).rejects.toThrow('provider down');

      await context.service.finalizeDeterministically(session.getId());

      expect(context.repository.sessions.get(session.getId())?.status).toBe('COMPLETED');
    });
  });

  describe('sweep', () => {
    it('concludes overdue sessions and re-enqueues stale scoring', async () => {
      const { service, repository, queue } = build();
      const overdue = await service.start(startCommand());
      const answered = await answerCurrent(service, overdue);
      const stored = repository.sessions.get(answered.getId());
      if (!stored) throw new Error('missing session');
      repository.sessions.set(answered.getId(), {
        ...stored,
        deadlineAt: new Date(Date.now() - 60 * 60_000),
      });

      const now = new Date();
      await expect(service.sweep(now)).resolves.toBe(1);
      expect(repository.sessions.get(answered.getId())?.status).toBe('SCORING');
      queue.enqueue.mockClear();

      const later = new Date(now.getTime() + 10 * 60_000);
      await expect(service.sweep(later)).resolves.toBe(1);
      expect(queue.enqueue).toHaveBeenCalledWith({ sessionId: answered.getId() });
    });
  });
});

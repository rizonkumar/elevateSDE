import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubmissionStatus } from '@prisma/client';
import { CodeExecutionProcessor } from './code-execution.processor';
import { CodeRunnerService } from '../../application/code-runner.service';
import { SubmissionService } from '../../application/submission.service';
import { SubmissionInsightsService } from '../../application/submission-insights.service';
import { DailyChallengeService } from '../../../daily-challenge/application/daily-challenge.service';
import { AchievementService } from '../../../achievement/application/achievement.service';
import { PointsService } from '../../../leaderboard/application/points.service';
import { ProblemAssistanceService } from '../../../problem-assistance/application/problem-assistance.service';
import { AssessmentRunOutcome } from '../../application/assessment-outcome';
import { CodeExecutionJobData } from '../../../queues/domain/interfaces/code-execution-queue.interface';
import {
  SUBMISSION_EVENTS,
  SubmissionJudgedEvent,
} from '../../domain/events/submission-events';

const JOB_DATA: CodeExecutionJobData = {
  submissionId: 's1',
  userId: 'u1',
  problemId: 'p1',
  language: 'javascript',
  code: 'solve()',
};

const OUTCOME: AssessmentRunOutcome = {
  status: SubmissionStatus.ACCEPTED,
  results: [],
  passedCount: 1,
  totalCount: 1,
  totalRuntimeMs: 5,
  peakMemoryKb: 1024,
  stdout: '',
};

function buildProcessor(): {
  processor: CodeExecutionProcessor;
  evaluate: jest.Mock;
  markRunning: jest.Mock;
  applyResult: jest.Mock;
  markFailed: jest.Mock;
  registerCompletion: jest.Mock;
  evaluateAchievements: jest.Mock;
  awardProblemSolved: jest.Mock;
  isAssisted: jest.Mock;
  percentilesFor: jest.Mock;
  eventEmitter: EventEmitter2;
} {
  const eventEmitter = new EventEmitter2();
  const evaluate = jest.fn().mockResolvedValue(OUTCOME);
  const markRunning = jest.fn().mockResolvedValue(undefined);
  const applyResult = jest.fn().mockResolvedValue(undefined);
  const markFailed = jest.fn().mockResolvedValue(undefined);
  const registerCompletion = jest.fn().mockResolvedValue(undefined);
  const evaluateAchievements = jest.fn().mockResolvedValue(undefined);
  const awardProblemSolved = jest.fn().mockResolvedValue(true);
  const codeRunnerService = { evaluate } as unknown as CodeRunnerService;
  const submissionService = {
    markRunning,
    applyResult,
    markFailed,
  } as unknown as SubmissionService;
  const percentilesFor = jest.fn().mockResolvedValue({ runtime: 75, memory: 40 });
  const insightsService = { percentilesFor } as unknown as SubmissionInsightsService;
  const dailyChallengeService = { registerCompletion } as unknown as DailyChallengeService;
  const achievementService = {
    evaluate: evaluateAchievements,
  } as unknown as AchievementService;
  const pointsService = { awardProblemSolved } as unknown as PointsService;
  const isAssisted = jest.fn().mockResolvedValue(false);
  const problemAssistanceService = { isAssisted } as unknown as ProblemAssistanceService;
  return {
    processor: new CodeExecutionProcessor(
      codeRunnerService,
      submissionService,
      insightsService,
      dailyChallengeService,
      achievementService,
      pointsService,
      problemAssistanceService,
      eventEmitter,
    ),
    evaluate,
    markRunning,
    applyResult,
    markFailed,
    registerCompletion,
    evaluateAchievements,
    awardProblemSolved,
    isAssisted,
    percentilesFor,
    eventEmitter,
  };
}

describe('CodeExecutionProcessor', () => {
  it.each([SubmissionStatus.ACCEPTED, SubmissionStatus.WRONG_ANSWER])(
    'emits a judged event with the final %s status',
    async (status) => {
      const { processor, evaluate, eventEmitter } = buildProcessor();
      evaluate.mockResolvedValue({ ...OUTCOME, status });
      const judged: SubmissionJudgedEvent[] = [];
      eventEmitter.on(SUBMISSION_EVENTS.JUDGED, (event: SubmissionJudgedEvent) => {
        judged.push(event);
      });

      await processor.process({ data: JOB_DATA } as Job<CodeExecutionJobData>);

      expect(judged).toEqual([
        {
          submissionId: 's1',
          userId: 'u1',
          problemId: 'p1',
          status,
          judgedAt: expect.any(Date),
        },
      ]);
    },
  );

  it('emits a runtime error judged event once retries are exhausted', async () => {
    const { processor, eventEmitter } = buildProcessor();
    const judged: SubmissionJudgedEvent[] = [];
    eventEmitter.on(SUBMISSION_EVENTS.JUDGED, (event: SubmissionJudgedEvent) => {
      judged.push(event);
    });

    await processor.onFailed({
      data: JOB_DATA,
      attemptsMade: 3,
      opts: { attempts: 3 },
    } as Job<CodeExecutionJobData>);

    expect(judged.map((event) => event.status)).toEqual([SubmissionStatus.RUNTIME_ERROR]);
  });

  it('marks the submission running, evaluates all cases, then persists the outcome', async () => {
    const { processor, evaluate, markRunning, applyResult } = buildProcessor();
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(markRunning).toHaveBeenCalledWith('s1');
    expect(evaluate).toHaveBeenCalledWith('p1', 'javascript', 'solve()', true);
    expect(applyResult).toHaveBeenCalledWith('s1', OUTCOME, { runtime: 75, memory: 40 });
  });

  it('registers a daily challenge completion and evaluates achievements when accepted', async () => {
    const { processor, registerCompletion, evaluateAchievements } = buildProcessor();
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(registerCompletion).toHaveBeenCalledWith('u1', 'p1', 's1');
    expect(evaluateAchievements).toHaveBeenCalledWith('u1');
  });

  it('awards problem points before evaluating achievements', async () => {
    const { processor, awardProblemSolved, evaluateAchievements } = buildProcessor();
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(awardProblemSolved).toHaveBeenCalledWith('u1', 'p1');
    const [awardOrder] = awardProblemSolved.mock.invocationCallOrder;
    const [evaluateOrder] = evaluateAchievements.mock.invocationCallOrder;
    expect(awardOrder).toBeLessThan(evaluateOrder ?? 0);
  });

  it('does not register a completion, award points or evaluate achievements when not accepted', async () => {
    const { processor, evaluate, registerCompletion, evaluateAchievements, awardProblemSolved } =
      buildProcessor();
    evaluate.mockResolvedValue({ ...OUTCOME, status: SubmissionStatus.WRONG_ANSWER });
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(registerCompletion).not.toHaveBeenCalled();
    expect(awardProblemSolved).not.toHaveBeenCalled();
    expect(evaluateAchievements).not.toHaveBeenCalled();
  });

  it('skips points and daily challenge credit when the user gave up before solving', async () => {
    const { processor, isAssisted, registerCompletion, awardProblemSolved, evaluateAchievements } =
      buildProcessor();
    isAssisted.mockResolvedValue(true);
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(isAssisted).toHaveBeenCalledWith('u1', 'p1');
    expect(registerCompletion).not.toHaveBeenCalled();
    expect(awardProblemSolved).not.toHaveBeenCalled();
    expect(evaluateAchievements).toHaveBeenCalledWith('u1');
  });

  it('computes percentiles from the run before persisting an accepted result', async () => {
    const { processor, percentilesFor, applyResult } = buildProcessor();
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(percentilesFor).toHaveBeenCalledWith({
      userId: 'u1',
      problemId: 'p1',
      language: 'javascript',
      runtimeMs: 5,
      memoryKb: 1024,
    });
    const [percentileOrder] = percentilesFor.mock.invocationCallOrder;
    const [applyOrder] = applyResult.mock.invocationCallOrder;
    expect(percentileOrder).toBeLessThan(applyOrder ?? 0);
  });

  it('still saves the result when percentiles cannot be computed', async () => {
    const { processor, percentilesFor, applyResult } = buildProcessor();
    percentilesFor.mockRejectedValue(new Error('db down'));
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(applyResult).toHaveBeenCalledWith('s1', OUTCOME, { runtime: null, memory: null });
  });

  it('skips percentiles for rejected submissions', async () => {
    const { processor, evaluate, percentilesFor, applyResult } = buildProcessor();
    const rejected = { ...OUTCOME, status: SubmissionStatus.WRONG_ANSWER };
    evaluate.mockResolvedValue(rejected);
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(percentilesFor).not.toHaveBeenCalled();
    expect(applyResult).toHaveBeenCalledWith('s1', rejected, { runtime: null, memory: null });
  });

  it('does not mark failed while retries remain', async () => {
    const { processor, markFailed } = buildProcessor();
    const job = {
      data: JOB_DATA,
      attemptsMade: 1,
      opts: { attempts: 3 },
    } as Job<CodeExecutionJobData>;

    await processor.onFailed(job);

    expect(markFailed).not.toHaveBeenCalled();
  });

  it('marks the submission failed once retries are exhausted', async () => {
    const { processor, markFailed } = buildProcessor();
    const job = {
      data: JOB_DATA,
      attemptsMade: 3,
      opts: { attempts: 3 },
    } as Job<CodeExecutionJobData>;

    await processor.onFailed(job);

    expect(markFailed).toHaveBeenCalledWith('s1', expect.any(String));
  });
});

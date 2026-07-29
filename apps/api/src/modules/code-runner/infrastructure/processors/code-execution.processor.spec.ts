import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubmissionStatus } from '@prisma/client';
import { CodeExecutionProcessor } from './code-execution.processor';
import { CodeRunnerService } from '../../application/code-runner.service';
import { SubmissionService } from '../../application/submission.service';
import { DailyChallengeService } from '../../../daily-challenge/application/daily-challenge.service';
import { AchievementService } from '../../../achievement/application/achievement.service';
import { ScoringService } from '../../../scoring/application/scoring.service';
import { AssessmentRunOutcome } from '../../application/assessment-outcome';
import { CodeExecutionJobData } from '../../../queues/domain/interfaces/code-execution-queue.interface';
import { NOTIFICATION_EVENTS } from '../../../notification/domain/events/notification-events';

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
  awardForAcceptedSubmission: jest.Mock;
  emit: jest.Mock;
  calls: string[];
} {
  const calls: string[] = [];
  const evaluate = jest.fn().mockResolvedValue(OUTCOME);
  const markRunning = jest.fn().mockResolvedValue(undefined);
  const applyResult = jest.fn().mockResolvedValue(undefined);
  const markFailed = jest.fn().mockResolvedValue(undefined);
  const awardForAcceptedSubmission = jest.fn().mockImplementation(() => {
    calls.push('score');
    return Promise.resolve({ firstSolve: true, pointsAwarded: 25 });
  });
  const registerCompletion = jest.fn().mockImplementation(() => {
    calls.push('daily');
    return Promise.resolve(undefined);
  });
  const evaluateAchievements = jest.fn().mockImplementation(() => {
    calls.push('achievements');
    return Promise.resolve(undefined);
  });
  const emit = jest.fn().mockImplementation(() => {
    calls.push('event');
    return true;
  });
  const codeRunnerService = { evaluate } as unknown as CodeRunnerService;
  const submissionService = {
    markRunning,
    applyResult,
    markFailed,
  } as unknown as SubmissionService;
  const scoringService = { awardForAcceptedSubmission } as unknown as ScoringService;
  const dailyChallengeService = { registerCompletion } as unknown as DailyChallengeService;
  const achievementService = {
    evaluate: evaluateAchievements,
  } as unknown as AchievementService;
  const eventEmitter = { emit } as unknown as EventEmitter2;
  return {
    processor: new CodeExecutionProcessor(
      codeRunnerService,
      submissionService,
      scoringService,
      dailyChallengeService,
      achievementService,
      eventEmitter,
    ),
    evaluate,
    markRunning,
    applyResult,
    markFailed,
    registerCompletion,
    evaluateAchievements,
    awardForAcceptedSubmission,
    emit,
    calls,
  };
}

describe('CodeExecutionProcessor', () => {
  it('marks the submission running, evaluates all cases, then persists the outcome', async () => {
    const { processor, evaluate, markRunning, applyResult } = buildProcessor();
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(markRunning).toHaveBeenCalledWith('s1');
    expect(evaluate).toHaveBeenCalledWith('p1', 'javascript', 'solve()', true);
    expect(applyResult).toHaveBeenCalledWith('s1', OUTCOME);
  });

  it('registers a daily challenge completion and evaluates achievements when accepted', async () => {
    const { processor, registerCompletion, evaluateAchievements } = buildProcessor();
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(registerCompletion).toHaveBeenCalledWith('u1', 'p1', 's1');
    expect(evaluateAchievements).toHaveBeenCalledWith('u1');
  });

  it('does not register a completion or evaluate achievements when not accepted', async () => {
    const { processor, evaluate, registerCompletion, evaluateAchievements, calls } =
      buildProcessor();
    evaluate.mockResolvedValue({ ...OUTCOME, status: SubmissionStatus.WRONG_ANSWER });
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(registerCompletion).not.toHaveBeenCalled();
    expect(evaluateAchievements).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it('awards points before evaluating achievements so points badges do not lag', async () => {
    const { processor, awardForAcceptedSubmission, calls } = buildProcessor();
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(awardForAcceptedSubmission).toHaveBeenCalledWith('u1', 'p1');
    expect(calls).toEqual(['score', 'daily', 'achievements', 'event']);
  });

  it('emits the accepted event carrying the award outcome', async () => {
    const { processor, emit } = buildProcessor();
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await processor.process(job);

    expect(emit).toHaveBeenCalledWith(NOTIFICATION_EVENTS.SUBMISSION_ACCEPTED, {
      userId: 'u1',
      problemId: 'p1',
      submissionId: 's1',
      firstSolve: true,
      pointsAwarded: 25,
    });
  });

  it('propagates a scoring failure so the job retries', async () => {
    const { processor, awardForAcceptedSubmission, registerCompletion } = buildProcessor();
    awardForAcceptedSubmission.mockRejectedValue(new Error('ledger unavailable'));
    const job = { data: JOB_DATA } as Job<CodeExecutionJobData>;

    await expect(processor.process(job)).rejects.toThrow('ledger unavailable');
    expect(registerCompletion).not.toHaveBeenCalled();
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

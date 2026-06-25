import { Job } from 'bullmq';
import { SubmissionStatus } from '@prisma/client';
import { CodeExecutionProcessor } from './code-execution.processor';
import { CodeRunnerService } from '../../application/code-runner.service';
import { SubmissionService } from '../../application/submission.service';
import { AssessmentRunOutcome } from '../../application/assessment-outcome';
import { CodeExecutionJobData } from '../../../queues/domain/interfaces/code-execution-queue.interface';

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
} {
  const evaluate = jest.fn().mockResolvedValue(OUTCOME);
  const markRunning = jest.fn().mockResolvedValue(undefined);
  const applyResult = jest.fn().mockResolvedValue(undefined);
  const markFailed = jest.fn().mockResolvedValue(undefined);
  const codeRunnerService = { evaluate } as unknown as CodeRunnerService;
  const submissionService = {
    markRunning,
    applyResult,
    markFailed,
  } as unknown as SubmissionService;
  return {
    processor: new CodeExecutionProcessor(codeRunnerService, submissionService),
    evaluate,
    markRunning,
    applyResult,
    markFailed,
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

  it('does not mark failed while retries remain', async () => {
    const { processor, markFailed } = buildProcessor();
    const job = { data: JOB_DATA, attemptsMade: 1, opts: { attempts: 3 } } as Job<CodeExecutionJobData>;

    await processor.onFailed(job);

    expect(markFailed).not.toHaveBeenCalled();
  });

  it('marks the submission failed once retries are exhausted', async () => {
    const { processor, markFailed } = buildProcessor();
    const job = { data: JOB_DATA, attemptsMade: 3, opts: { attempts: 3 } } as Job<CodeExecutionJobData>;

    await processor.onFailed(job);

    expect(markFailed).toHaveBeenCalledWith('s1', expect.any(String));
  });
});

import {
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AssessmentDifficulty,
  AssessmentLanguage,
  CodeReviewEngine,
  ComparisonMode,
  SubmissionStatus,
  TestCaseResultStatus,
} from '@prisma/client';
import { Submission } from '../../code-runner/domain/entities/submission';
import { SubmissionResult } from '../../code-runner/domain/entities/submission-result';
import { SubmissionService } from '../../code-runner/application/submission.service';
import { Problem } from '../../problem/domain/entities/problem';
import { ProblemTestCase } from '../../problem/domain/entities/problem-test-case';
import { ProblemService } from '../../problem/application/problem.service';
import { ProblemAssistanceService } from '../../problem-assistance/application/problem-assistance.service';
import { FeatureFlagService } from '../../feature-flag/application/feature-flag.service';
import { ICodeReviewQueue } from '../../queues/domain/interfaces/code-review-queue.interface';
import { ICodeReviewRepository } from '../domain/interfaces/code-review-repository.interface';
import { CodeReviewOutcome, ICodeReviewer } from '../domain/interfaces/code-reviewer.interface';
import { SubmissionReviewView } from '../domain/review/submission-review-view';
import { DAILY_REVIEW_LIMIT } from '../domain/review/code-review-result';
import { CodeReviewService, buildRequest } from './code-review.service';

const OWNER = 'owner';

function result(id: string, status: TestCaseResultStatus, hidden: boolean): SubmissionResult {
  return SubmissionResult.reconstitute({
    id: `r-${id}`,
    testCaseId: id,
    label: hidden ? 'Hidden case 1' : `Case ${id}`,
    status,
    actualOutput: hidden ? 'hidden-actual' : '[9]',
    runtimeMs: 1,
    memoryKb: 1,
    isHidden: hidden,
  });
}

function submission(status: SubmissionStatus = SubmissionStatus.WRONG_ANSWER): Submission {
  return Submission.reconstitute({
    id: 's1',
    userId: OWNER,
    problemId: 'p1',
    language: AssessmentLanguage.PYTHON,
    sourceCode: 'def f(nums):\n    return nums',
    status,
    passedCount: 1,
    totalCount: 3,
    totalRuntimeMs: 12,
    peakMemoryKb: 900,
    runtimePercentile: null,
    memoryPercentile: null,
    stdout: '',
    results: [
      result('v1', TestCaseResultStatus.PASS, false),
      result('v2', TestCaseResultStatus.FAIL, false),
      result('h1', TestCaseResultStatus.FAIL, true),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function testCase(id: string, hidden: boolean): ProblemTestCase {
  return ProblemTestCase.reconstitute({
    id,
    ordinal: 0,
    input: hidden ? 'hidden-input' : `[${id}]`,
    expectedOutput: hidden ? 'hidden-expected' : '[1]',
    isHidden: hidden,
  });
}

const PROBLEM = Problem.reconstitute({
  id: 'p1',
  tenantId: null,
  slug: 'p1',
  title: 'Sum',
  difficulty: AssessmentDifficulty.EASY,
  description: 'Add numbers.',
  constraints: ['1 <= n'],
  tags: [],
  starterCode: {},
  examples: [],
  functionName: 'f',
  harness: { paramTypes: ['int[]'], returnType: 'int[]' },
  referenceSolution: { python: 'SECRET_REFERENCE' },
  comparisonMode: ComparisonMode.EXACT,
  timeLimitMinutes: 30,
  isPublished: true,
  testCases: [testCase('v1', false), testCase('v2', false), testCase('h1', true)],
  topics: [],
  companies: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

function view(overrides: Partial<SubmissionReviewView> = {}): SubmissionReviewView {
  return {
    id: 'review-1',
    submissionId: 's1',
    userId: OWNER,
    status: 'PENDING',
    engine: null,
    timeComplexity: null,
    spaceComplexity: null,
    summary: null,
    findings: [],
    failureReason: null,
    createdAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

function build(
  options: {
    flag?: boolean;
    locked?: boolean;
    used?: number;
    existing?: SubmissionReviewView | null;
    status?: SubmissionStatus;
  } = {},
) {
  const repository = {
    findBySubmission: jest.fn().mockResolvedValue(options.existing ?? null),
    findById: jest.fn().mockResolvedValue(view()),
    createPending: jest.fn().mockResolvedValue(view()),
    complete: jest.fn().mockResolvedValue(view({ status: 'COMPLETED' })),
    fail: jest.fn().mockResolvedValue(undefined),
    countCreatedSince: jest.fn().mockResolvedValue(options.used ?? 0),
  };
  const outcome: CodeReviewOutcome = {
    engine: CodeReviewEngine.DETERMINISTIC,
    result: { timeComplexity: 'O(n)', spaceComplexity: 'O(1)', summary: 'ok', findings: [] },
  };
  const reviewer = { review: jest.fn().mockResolvedValue(outcome) };
  const queue = { enqueue: jest.fn().mockResolvedValue(undefined) };
  const own = submission(options.status);
  const submissions = {
    getForUser: jest.fn((id: string, userId: string) =>
      Promise.resolve(id === 's1' && userId === OWNER ? own : null),
    ),
  };
  const problems = { getByIdForAdmin: jest.fn().mockResolvedValue(PROBLEM) };
  const assistance = { isLockedByContest: jest.fn().mockResolvedValue(options.locked ?? false) };
  const flags = { evaluate: jest.fn().mockResolvedValue(options.flag ?? true) };
  const events = new EventEmitter2();
  const emitted = jest.spyOn(events, 'emit');
  const service = new CodeReviewService(
    repository as unknown as ICodeReviewRepository,
    reviewer as unknown as ICodeReviewer,
    queue as unknown as ICodeReviewQueue,
    submissions as unknown as SubmissionService,
    problems as unknown as ProblemService,
    assistance as unknown as ProblemAssistanceService,
    flags as unknown as FeatureFlagService,
    events,
  );
  return { service, repository, reviewer, queue, emitted };
}

describe('CodeReviewService', () => {
  it('creates a pending review and queues it', async () => {
    const { service, repository, queue } = build();

    const review = await service.request(OWNER, 's1');

    expect(review.status).toBe('PENDING');
    expect(repository.createPending).toHaveBeenCalledWith('s1', OWNER);
    expect(queue.enqueue).toHaveBeenCalledWith({ reviewId: 'review-1' });
  });

  it('returns the existing review without spending quota', async () => {
    const existing = view({ status: 'COMPLETED' });
    const { service, repository, queue } = build({ existing, used: DAILY_REVIEW_LIMIT });

    expect(await service.request(OWNER, 's1')).toBe(existing);
    expect(repository.createPending).not.toHaveBeenCalled();
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it("hides other users' submissions", async () => {
    const { service } = build();

    await expect(service.request('intruder', 's1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getForSubmission('intruder', 's1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuses unfinished submissions', async () => {
    const { service } = build({ status: SubmissionStatus.RUNNING });

    await expect(service.request(OWNER, 's1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('respects the feature flag and the live contest lock', async () => {
    await expect(build({ flag: false }).service.request(OWNER, 's1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(build({ locked: true }).service.request(OWNER, 's1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('enforces the daily limit', async () => {
    const { service } = build({ used: DAILY_REVIEW_LIMIT });

    await expect(service.request(OWNER, 's1')).rejects.toBeInstanceOf(HttpException);
    await expect(service.request(OWNER, 's1')).rejects.toMatchObject({ status: 429 });
  });

  it('runs the reviewer, stores the outcome and notifies the user', async () => {
    const { service, reviewer, repository, emitted } = build();

    await service.run('review-1');

    expect(reviewer.review).toHaveBeenCalledTimes(1);
    expect(repository.complete).toHaveBeenCalledWith(
      'review-1',
      expect.anything(),
      expect.any(Date),
    );
    expect(emitted).toHaveBeenCalledWith(
      'notification.code-review-ready',
      expect.objectContaining({ userId: OWNER, submissionId: 's1' }),
    );
  });
});

describe('buildRequest', () => {
  it('shares failing visible cases but never hidden inputs, outputs or the reference', () => {
    const request = buildRequest(submission(), PROBLEM);

    expect(request.failingVisibleCases).toEqual([
      { label: 'Case v2', input: '[v2]', expectedOutput: '[1]', actualOutput: '[9]' },
    ]);
    expect(request.hiddenCasesFailed).toBe(1);
    const serialized = JSON.stringify(request);
    expect(serialized).not.toContain('hidden-input');
    expect(serialized).not.toContain('hidden-expected');
    expect(serialized).not.toContain('hidden-actual');
    expect(serialized).not.toContain('SECRET_REFERENCE');
  });
});

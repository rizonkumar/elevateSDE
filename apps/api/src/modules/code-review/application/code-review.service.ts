import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubmissionStatus, TestCaseResultStatus } from '@prisma/client';
import { ProblemService } from '../../problem/application/problem.service';
import { ProblemAssistanceService } from '../../problem-assistance/application/problem-assistance.service';
import { FeatureFlagService } from '../../feature-flag/application/feature-flag.service';
import { SubmissionService } from '../../code-runner/application/submission.service';
import { fromPrismaLanguage } from '../../code-runner/application/language';
import { Submission } from '../../code-runner/domain/entities/submission';
import { Problem } from '../../problem/domain/entities/problem';
import { ICodeReviewQueue } from '../../queues/domain/interfaces/code-review-queue.interface';
import {
  CodeReviewReadyEvent,
  NOTIFICATION_EVENTS,
} from '../../notification/domain/events/notification-events';
import { ICodeReviewRepository } from '../domain/interfaces/code-review-repository.interface';
import {
  CodeReviewRequest,
  FailingVisibleCase,
  ICodeReviewer,
  ReviewableVerdict,
} from '../domain/interfaces/code-reviewer.interface';
import { DAILY_REVIEW_LIMIT } from '../domain/review/code-review-result';
import { SubmissionReviewView } from '../domain/review/submission-review-view';

export const CODE_REVIEW_FLAG = 'AI_CODE_REVIEW';

const REVIEWABLE: ReadonlySet<SubmissionStatus> = new Set([
  SubmissionStatus.ACCEPTED,
  SubmissionStatus.WRONG_ANSWER,
  SubmissionStatus.TIME_LIMIT_EXCEEDED,
  SubmissionStatus.RUNTIME_ERROR,
]);

const MAX_FAILING_CASES = 3;

export interface CodeReviewQuota {
  limit: number;
  used: number;
  remaining: number;
  enabled: boolean;
}

function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

@Injectable()
export class CodeReviewService {
  constructor(
    private readonly repository: ICodeReviewRepository,
    private readonly reviewer: ICodeReviewer,
    private readonly queue: ICodeReviewQueue,
    private readonly submissionService: SubmissionService,
    private readonly problemService: ProblemService,
    private readonly assistanceService: ProblemAssistanceService,
    private readonly featureFlags: FeatureFlagService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getQuota(userId: string, now: Date = new Date()): Promise<CodeReviewQuota> {
    const [enabled, used] = await Promise.all([
      this.featureFlags.evaluate(CODE_REVIEW_FLAG, userId),
      this.repository.countCreatedSince(userId, startOfUtcDay(now)),
    ]);
    return {
      limit: DAILY_REVIEW_LIMIT,
      used,
      remaining: Math.max(0, DAILY_REVIEW_LIMIT - used),
      enabled,
    };
  }

  async getForSubmission(userId: string, submissionId: string): Promise<SubmissionReviewView> {
    await this.requireOwnedSubmission(userId, submissionId);
    const review = await this.repository.findBySubmission(submissionId);
    if (!review) {
      throw new NotFoundException('This submission has not been reviewed yet.');
    }
    return review;
  }

  async request(userId: string, submissionId: string): Promise<SubmissionReviewView> {
    const submission = await this.requireOwnedSubmission(userId, submissionId);
    const existing = await this.repository.findBySubmission(submissionId);
    if (existing) {
      return existing;
    }
    if (!REVIEWABLE.has(submission.getStatus())) {
      throw new ConflictException('Only finished submissions that ran can be reviewed.');
    }
    if (!(await this.featureFlags.evaluate(CODE_REVIEW_FLAG, userId))) {
      throw new ForbiddenException('Code review is not available for your account yet.');
    }
    if (await this.assistanceService.isLockedByContest(userId, submission.getProblemId())) {
      throw new ForbiddenException('Code review is unavailable during a live contest.');
    }
    const quota = await this.getQuota(userId);
    if (quota.remaining === 0) {
      throw new HttpException(
        `You have used all ${DAILY_REVIEW_LIMIT} code reviews for today.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const review = await this.repository.createPending(submissionId, userId);
    await this.queue.enqueue({ reviewId: review.id });
    return review;
  }

  async run(reviewId: string): Promise<void> {
    const review = await this.repository.findById(reviewId);
    if (!review || review.status !== 'PENDING') {
      return;
    }
    const submission = await this.submissionService.getForUser(review.submissionId, review.userId);
    if (!submission) {
      await this.repository.fail(reviewId, 'The submission no longer exists.', new Date());
      return;
    }
    const problem = await this.problemService.getByIdForAdmin(submission.getProblemId());
    const outcome = await this.reviewer.review(buildRequest(submission, problem));
    await this.repository.complete(reviewId, outcome, new Date());
    this.eventEmitter.emit(NOTIFICATION_EVENTS.CODE_REVIEW_READY, {
      userId: review.userId,
      problemId: problem.getId(),
      problemTitle: problem.getTitle(),
      submissionId: submission.getId(),
    } satisfies CodeReviewReadyEvent);
  }

  async markFailed(reviewId: string): Promise<void> {
    await this.repository.fail(
      reviewId,
      'The review could not be completed. Please try again later.',
      new Date(),
    );
  }

  private async requireOwnedSubmission(userId: string, submissionId: string): Promise<Submission> {
    const submission = await this.submissionService.getForUser(submissionId, userId);
    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }
    return submission;
  }
}

export function buildRequest(submission: Submission, problem: Problem): CodeReviewRequest {
  const visibleCases = new Map(
    problem.getVisibleTestCases().map((testCase) => [testCase.getId(), testCase]),
  );
  const failingVisibleCases: FailingVisibleCase[] = [];
  let hiddenCasesFailed = 0;
  for (const result of submission.getResults()) {
    if (result.getStatus() === TestCaseResultStatus.PASS) continue;
    if (result.isHidden()) {
      hiddenCasesFailed += 1;
      continue;
    }
    const testCase = visibleCases.get(result.getTestCaseId());
    if (testCase && failingVisibleCases.length < MAX_FAILING_CASES) {
      failingVisibleCases.push({
        label: result.getLabel(),
        input: testCase.getInput(),
        expectedOutput: testCase.getExpectedOutput(),
        actualOutput: result.getActualOutput(),
      });
    }
  }
  return {
    language: fromPrismaLanguage[submission.getLanguage()],
    functionName: problem.getFunctionName(),
    problemTitle: problem.getTitle(),
    problemDescription: problem.getDescription(),
    constraints: problem.getConstraints(),
    code: submission.getSourceCode(),
    verdict: submission.getStatus() as ReviewableVerdict,
    passedCount: submission.getPassedCount(),
    totalCount: submission.getTotalCount(),
    runtimeMs: submission.getTotalRuntimeMs(),
    failingVisibleCases,
    hiddenCasesFailed,
  };
}

import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import { SubmissionStatus } from '@prisma/client';
import { QUEUE_NAMES } from '../../../queues/domain/queue-names';
import { CodeExecutionJobData } from '../../../queues/domain/interfaces/code-execution-queue.interface';
import { DailyChallengeService } from '../../../daily-challenge/application/daily-challenge.service';
import { AchievementService } from '../../../achievement/application/achievement.service';
import {
  NOTIFICATION_EVENTS,
  SubmissionAcceptedEvent,
} from '../../../notification/domain/events/notification-events';
import { CodeRunnerService } from '../../application/code-runner.service';
import { SubmissionService } from '../../application/submission.service';

const FAILURE_MESSAGE = 'Execution failed unexpectedly. Please try again.';

@Processor(QUEUE_NAMES.CODE_EXECUTION)
export class CodeExecutionProcessor extends WorkerHost {
  private readonly logger = new Logger(CodeExecutionProcessor.name);

  constructor(
    private readonly codeRunnerService: CodeRunnerService,
    private readonly submissionService: SubmissionService,
    private readonly dailyChallengeService: DailyChallengeService,
    private readonly achievementService: AchievementService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<CodeExecutionJobData>): Promise<void> {
    const { submissionId, userId, problemId, language, code } = job.data;
    await this.submissionService.markRunning(submissionId);
    const outcome = await this.codeRunnerService.evaluate(problemId, language, code, true);
    await this.submissionService.applyResult(submissionId, outcome);
    if (outcome.status === SubmissionStatus.ACCEPTED) {
      await this.dailyChallengeService.registerCompletion(userId, problemId, submissionId);
      await this.achievementService.evaluate(userId);
      this.eventEmitter.emit(NOTIFICATION_EVENTS.SUBMISSION_ACCEPTED, {
        userId,
        problemId,
      } satisfies SubmissionAcceptedEvent);
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<CodeExecutionJobData>): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return;
    this.logger.error(`Code execution job ${job.id} failed after ${job.attemptsMade} attempts`);
    await this.submissionService.markFailed(job.data.submissionId, FAILURE_MESSAGE);
  }
}

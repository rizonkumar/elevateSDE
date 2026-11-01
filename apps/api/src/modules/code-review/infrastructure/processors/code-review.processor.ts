import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../../queues/domain/queue-names';
import { CodeReviewJobData } from '../../../queues/domain/interfaces/code-review-queue.interface';
import { CodeReviewService } from '../../application/code-review.service';

@Processor(QUEUE_NAMES.CODE_REVIEW)
export class CodeReviewProcessor extends WorkerHost {
  private readonly logger = new Logger(CodeReviewProcessor.name);

  constructor(private readonly service: CodeReviewService) {
    super();
  }

  async process(job: Job<CodeReviewJobData>): Promise<void> {
    await this.service.run(job.data.reviewId);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<CodeReviewJobData>): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return;
    this.logger.error(`Code review job ${job.id} failed after ${job.attemptsMade} attempts`);
    await this.service.markFailed(job.data.reviewId);
  }
}

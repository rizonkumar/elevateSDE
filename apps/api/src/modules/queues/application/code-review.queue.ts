import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../domain/queue-names';
import {
  CodeReviewJobData,
  ICodeReviewQueue,
} from '../domain/interfaces/code-review-queue.interface';

const JOB_NAME = 'review';
const MAX_ATTEMPTS = 2;
const BACKOFF_DELAY_MS = 3000;
const RETAINED_FAILURES = 100;

@Injectable()
export class CodeReviewQueue implements ICodeReviewQueue {
  constructor(
    @InjectQueue(QUEUE_NAMES.CODE_REVIEW)
    private readonly queue: Queue<CodeReviewJobData>,
  ) {}

  async enqueue(data: CodeReviewJobData): Promise<void> {
    await this.queue.add(JOB_NAME, data, {
      jobId: `review-${data.reviewId}`,
      attempts: MAX_ATTEMPTS,
      backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
      removeOnComplete: true,
      removeOnFail: RETAINED_FAILURES,
    });
  }
}

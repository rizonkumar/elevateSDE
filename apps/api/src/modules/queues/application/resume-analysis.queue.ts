import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../domain/queue-names';
import {
  IResumeAnalysisQueue,
  ResumeAnalysisJobData,
} from '../domain/interfaces/resume-analysis-queue.interface';

const JOB_NAME = 'analyze';
const MAX_ATTEMPTS = 3;
const BACKOFF_DELAY_MS = 1000;
const RETAINED_FAILURES = 100;

@Injectable()
export class ResumeAnalysisQueue implements IResumeAnalysisQueue {
  constructor(
    @InjectQueue(QUEUE_NAMES.RESUME)
    private readonly queue: Queue<ResumeAnalysisJobData>,
  ) {}

  async enqueue(data: ResumeAnalysisJobData): Promise<void> {
    await this.queue.add(JOB_NAME, data, {
      attempts: MAX_ATTEMPTS,
      backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
      removeOnComplete: true,
      removeOnFail: RETAINED_FAILURES,
    });
  }
}

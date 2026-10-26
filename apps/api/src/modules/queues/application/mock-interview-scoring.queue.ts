import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../domain/queue-names';
import {
  IMockInterviewScoringQueue,
  MockInterviewScoringJobData,
} from '../domain/interfaces/mock-interview-scoring-queue.interface';

const JOB_NAME = 'score';
const MAX_ATTEMPTS = 3;
const BACKOFF_DELAY_MS = 2000;
const RETAINED_FAILURES = 100;

@Injectable()
export class MockInterviewScoringQueue implements IMockInterviewScoringQueue {
  constructor(
    @InjectQueue(QUEUE_NAMES.MOCK_INTERVIEW)
    private readonly queue: Queue<MockInterviewScoringJobData>,
  ) {}

  async enqueue(data: MockInterviewScoringJobData): Promise<void> {
    await this.queue.add(JOB_NAME, data, {
      jobId: `score-${data.sessionId}`,
      attempts: MAX_ATTEMPTS,
      backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
      removeOnComplete: true,
      removeOnFail: RETAINED_FAILURES,
    });
  }
}

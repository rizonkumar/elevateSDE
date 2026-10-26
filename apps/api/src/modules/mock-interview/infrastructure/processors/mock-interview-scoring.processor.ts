import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../../queues/domain/queue-names';
import { MockInterviewScoringJobData } from '../../../queues/domain/interfaces/mock-interview-scoring-queue.interface';
import { MockInterviewService } from '../../application/mock-interview.service';

@Processor(QUEUE_NAMES.MOCK_INTERVIEW)
export class MockInterviewScoringProcessor extends WorkerHost {
  private readonly logger = new Logger(MockInterviewScoringProcessor.name);

  constructor(private readonly service: MockInterviewService) {
    super();
  }

  async process(job: Job<MockInterviewScoringJobData>): Promise<void> {
    await this.service.finalize(job.data.sessionId);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<MockInterviewScoringJobData>): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return;
    this.logger.error(
      `Mock interview scoring job ${job.id} failed after ${job.attemptsMade} attempts; using deterministic summary`,
    );
    await this.service.finalizeDeterministically(job.data.sessionId);
  }
}

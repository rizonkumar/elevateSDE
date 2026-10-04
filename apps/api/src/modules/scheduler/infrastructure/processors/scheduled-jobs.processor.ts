import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../../queues/domain/queue-names';
import { ScheduledJobData } from '../../../queues/domain/interfaces/scheduled-job-queue.interface';
import { isScheduledJobName } from '../../domain/scheduled-jobs';
import { ScheduledJobRunner } from '../../application/scheduled-job-runner.service';

@Processor(QUEUE_NAMES.SCHEDULED)
export class ScheduledJobsProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduledJobsProcessor.name);

  constructor(private readonly runner: ScheduledJobRunner) {
    super();
  }

  async process(job: Job<ScheduledJobData>): Promise<number> {
    if (!isScheduledJobName(job.name)) {
      this.logger.warn(`Ignoring unknown scheduled job ${job.name}`);
      return 0;
    }
    return this.runner.run(job.name);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ScheduledJobData>, error: Error): void {
    this.logger.error(
      `Scheduled job ${job.name} failed on attempt ${job.attemptsMade}: ${error.message}`,
    );
  }
}

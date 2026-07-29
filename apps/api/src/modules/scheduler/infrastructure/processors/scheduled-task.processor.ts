import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../../queues/domain/queue-names';
import { ScheduledTaskDispatcher } from '../../application/scheduled-task.dispatcher';
import { ScheduledTask } from '../../domain/scheduled-task';

@Processor(QUEUE_NAMES.SCHEDULED_TASKS)
export class ScheduledTaskProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduledTaskProcessor.name);

  constructor(private readonly dispatcher: ScheduledTaskDispatcher) {
    super();
  }

  async process(job: Job<Record<string, never>, void, ScheduledTask>): Promise<void> {
    await this.dispatcher.run(job.name, new Date());
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<Record<string, never>, void, ScheduledTask> | undefined): void {
    if (!job) {
      return;
    }
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) {
      return;
    }
    this.logger.error(`Scheduled task ${job.name} failed after ${job.attemptsMade} attempts`);
  }
}

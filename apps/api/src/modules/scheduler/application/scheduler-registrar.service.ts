import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { IScheduledJobQueue } from '../../queues/domain/interfaces/scheduled-job-queue.interface';
import {
  isScheduledJobName,
  SCHEDULED_JOB_NAMES,
  SCHEDULED_JOB_PATTERNS,
} from '../domain/scheduled-jobs';
import { isSchedulerEnabled } from '../infrastructure/scheduler-config';

@Injectable()
export class SchedulerRegistrar implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchedulerRegistrar.name);

  constructor(private readonly queue: IScheduledJobQueue) {}

  onApplicationBootstrap(): void {
    if (!isSchedulerEnabled()) {
      this.logger.log('Scheduler disabled; skipping job registration');
      return;
    }
    this.register().catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Failed to register scheduled jobs: ${reason}`);
    });
  }

  async register(): Promise<void> {
    const registered = await this.queue.listScheduleNames();
    const stale = registered.filter((name) => !isScheduledJobName(name));
    await Promise.all(stale.map((name) => this.queue.removeSchedule(name)));
    await Promise.all(
      SCHEDULED_JOB_NAMES.map((name) =>
        this.queue.upsertSchedule({ name, pattern: SCHEDULED_JOB_PATTERNS[name] }),
      ),
    );
    this.logger.log(
      `Registered ${SCHEDULED_JOB_NAMES.length} scheduled jobs, removed ${stale.length} stale`,
    );
  }
}

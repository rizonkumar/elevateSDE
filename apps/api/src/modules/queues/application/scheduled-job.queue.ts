import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { JobsOptions, Queue } from 'bullmq';
import { QUEUE_NAMES } from '../domain/queue-names';
import {
  IScheduledJobQueue,
  JobSchedule,
  ScheduledJobData,
} from '../domain/interfaces/scheduled-job-queue.interface';

const SCHEDULE_TIME_ZONE = 'UTC';
const MAX_ATTEMPTS = 3;
const BACKOFF_DELAY_MS = 5000;
const RETAINED_COMPLETIONS = 50;
const RETAINED_FAILURES = 100;

const JOB_OPTIONS: JobsOptions = {
  attempts: MAX_ATTEMPTS,
  backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
  removeOnComplete: RETAINED_COMPLETIONS,
  removeOnFail: RETAINED_FAILURES,
};

@Injectable()
export class ScheduledJobQueue implements IScheduledJobQueue {
  constructor(
    @InjectQueue(QUEUE_NAMES.SCHEDULED)
    private readonly queue: Queue<ScheduledJobData>,
  ) {}

  async upsertSchedule(schedule: JobSchedule): Promise<void> {
    await this.queue.upsertJobScheduler(
      schedule.name,
      { pattern: schedule.pattern, tz: SCHEDULE_TIME_ZONE },
      { name: schedule.name, data: {}, opts: JOB_OPTIONS },
    );
  }

  async listScheduleNames(): Promise<string[]> {
    const schedulers = await this.queue.getJobSchedulers();
    return schedulers.map((scheduler) => scheduler.key);
  }

  async removeSchedule(name: string): Promise<void> {
    await this.queue.removeJobScheduler(name);
  }

  async enqueueNow(name: string): Promise<void> {
    await this.queue.add(name, {}, JOB_OPTIONS);
  }
}

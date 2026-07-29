import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../../../queues/domain/queue-names';
import { IScheduledTaskQueue } from '../../domain/interfaces/scheduled-task-queue.interface';
import {
  ALL_SCHEDULED_TASKS,
  SCHEDULED_TASK_PATTERNS,
  ScheduledTask,
} from '../../domain/scheduled-task';

const MAX_ATTEMPTS = 3;
const BACKOFF_DELAY_MS = 1000;
const RETAINED_FAILURES = 100;

@Injectable()
export class ScheduledTaskQueue implements IScheduledTaskQueue, OnModuleInit {
  private readonly logger = new Logger(ScheduledTaskQueue.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.SCHEDULED_TASKS)
    private readonly queue: Queue<Record<string, never>, void, ScheduledTask>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.registerAll();
  }

  async registerAll(): Promise<void> {
    for (const task of ALL_SCHEDULED_TASKS) {
      await this.queue.upsertJobScheduler(
        task,
        { pattern: SCHEDULED_TASK_PATTERNS[task], tz: 'UTC' },
        {
          name: task,
          opts: {
            attempts: MAX_ATTEMPTS,
            backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
            removeOnComplete: true,
            removeOnFail: RETAINED_FAILURES,
          },
        },
      );
    }
    this.logger.log(`Registered ${ALL_SCHEDULED_TASKS.length} scheduled task(s)`);
  }
}

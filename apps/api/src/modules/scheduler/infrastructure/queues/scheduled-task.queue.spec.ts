import { Queue } from 'bullmq';
import { ScheduledTaskQueue } from './scheduled-task.queue';
import {
  ALL_SCHEDULED_TASKS,
  SCHEDULED_TASK_PATTERNS,
  ScheduledTask,
} from '../../domain/scheduled-task';

describe('ScheduledTaskQueue', () => {
  it('upserts one scheduler per task keyed by the task name so replicas dedupe', async () => {
    const upsertJobScheduler = jest.fn().mockResolvedValue(undefined);
    const queue = { upsertJobScheduler } as unknown as Queue<
      Record<string, never>,
      void,
      ScheduledTask
    >;

    await new ScheduledTaskQueue(queue).registerAll();

    expect(upsertJobScheduler).toHaveBeenCalledTimes(ALL_SCHEDULED_TASKS.length);
    for (const task of ALL_SCHEDULED_TASKS) {
      expect(upsertJobScheduler).toHaveBeenCalledWith(
        task,
        { pattern: SCHEDULED_TASK_PATTERNS[task], tz: 'UTC' },
        expect.objectContaining({ name: task }),
      );
    }
  });

  it('registers every task with retry and retention options', async () => {
    const upsertJobScheduler = jest.fn().mockResolvedValue(undefined);
    const queue = { upsertJobScheduler } as unknown as Queue<
      Record<string, never>,
      void,
      ScheduledTask
    >;

    await new ScheduledTaskQueue(queue).registerAll();

    for (const call of upsertJobScheduler.mock.calls) {
      expect(call[2]).toMatchObject({
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
        },
      });
    }
  });

  it('schedules the rollovers weekly on Monday and monthly on the first', () => {
    expect(SCHEDULED_TASK_PATTERNS['weekly-points-rollover']).toBe('0 0 * * 1');
    expect(SCHEDULED_TASK_PATTERNS['monthly-points-rollover']).toBe('0 0 1 * *');
  });
});

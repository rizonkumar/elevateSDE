import { SchedulerRegistrar } from './scheduler-registrar.service';
import {
  IScheduledJobQueue,
  JobSchedule,
} from '../../queues/domain/interfaces/scheduled-job-queue.interface';
import { SCHEDULED_JOB_NAMES, SCHEDULED_JOBS } from '../domain/scheduled-jobs';

class FakeScheduledJobQueue implements IScheduledJobQueue {
  schedules = new Map<string, string>();
  enqueued: string[] = [];

  async upsertSchedule(schedule: JobSchedule): Promise<void> {
    this.schedules.set(schedule.name, schedule.pattern);
  }

  async listScheduleNames(): Promise<string[]> {
    return [...this.schedules.keys()];
  }

  async removeSchedule(name: string): Promise<void> {
    this.schedules.delete(name);
  }

  async enqueueNow(name: string): Promise<void> {
    this.enqueued.push(name);
  }
}

describe('SchedulerRegistrar', () => {
  const originalFlag = process.env['SCHEDULER_ENABLED'];
  let queue: FakeScheduledJobQueue;
  let registrar: SchedulerRegistrar;

  beforeEach(() => {
    queue = new FakeScheduledJobQueue();
    registrar = new SchedulerRegistrar(queue);
  });

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env['SCHEDULER_ENABLED'];
    } else {
      process.env['SCHEDULER_ENABLED'] = originalFlag;
    }
  });

  it('registers every scheduled job with its cron pattern', async () => {
    await registrar.register();

    expect([...queue.schedules.keys()].sort()).toEqual([...SCHEDULED_JOB_NAMES].sort());
    expect(queue.schedules.get(SCHEDULED_JOBS.RESET_WEEKLY_POINTS)).toBe('0 0 * * 1');
  });

  it('removes schedulers that are no longer defined', async () => {
    queue.schedules.set('legacy.cleanup', '0 0 * * *');

    await registrar.register();

    expect(queue.schedules.has('legacy.cleanup')).toBe(false);
  });

  it('is idempotent across restarts', async () => {
    await registrar.register();
    await registrar.register();

    expect(queue.schedules.size).toBe(SCHEDULED_JOB_NAMES.length);
  });

  it('skips registration when the scheduler is disabled', async () => {
    process.env['SCHEDULER_ENABLED'] = 'false';

    registrar.onApplicationBootstrap();
    await Promise.resolve();

    expect(queue.schedules.size).toBe(0);
  });

  it('does not throw when registration fails at bootstrap', async () => {
    delete process.env['SCHEDULER_ENABLED'];
    jest.spyOn(queue, 'listScheduleNames').mockRejectedValue(new Error('redis unavailable'));

    expect(() => registrar.onApplicationBootstrap()).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));

    expect(queue.schedules.size).toBe(0);
  });
});

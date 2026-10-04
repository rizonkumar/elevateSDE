import { Queue } from 'bullmq';
import { ScheduledJobQueue } from './scheduled-job.queue';
import { ScheduledJobData } from '../domain/interfaces/scheduled-job-queue.interface';

function buildQueue(): {
  producer: ScheduledJobQueue;
  upsertJobScheduler: jest.Mock;
  getJobSchedulers: jest.Mock;
  removeJobScheduler: jest.Mock;
  add: jest.Mock;
} {
  const upsertJobScheduler = jest.fn().mockResolvedValue(undefined);
  const getJobSchedulers = jest.fn().mockResolvedValue([{ key: 'a' }, { key: 'b' }]);
  const removeJobScheduler = jest.fn().mockResolvedValue(true);
  const add = jest.fn().mockResolvedValue(undefined);
  const queue = {
    upsertJobScheduler,
    getJobSchedulers,
    removeJobScheduler,
    add,
  } as unknown as Queue<ScheduledJobData>;
  return {
    producer: new ScheduledJobQueue(queue),
    upsertJobScheduler,
    getJobSchedulers,
    removeJobScheduler,
    add,
  };
}

describe('ScheduledJobQueue', () => {
  it('upserts a UTC cron scheduler keyed by the job name', async () => {
    const { producer, upsertJobScheduler } = buildQueue();

    await producer.upsertSchedule({ name: 'streaks.expire', pattern: '5 0 * * *' });

    expect(upsertJobScheduler).toHaveBeenCalledWith(
      'streaks.expire',
      { pattern: '5 0 * * *', tz: 'UTC' },
      expect.objectContaining({
        name: 'streaks.expire',
        data: {},
        opts: expect.objectContaining({ attempts: 3 }),
      }),
    );
  });

  it('lists registered scheduler keys', async () => {
    const { producer } = buildQueue();

    await expect(producer.listScheduleNames()).resolves.toEqual(['a', 'b']);
  });

  it('removes a scheduler by name', async () => {
    const { producer, removeJobScheduler } = buildQueue();

    await producer.removeSchedule('legacy.job');

    expect(removeJobScheduler).toHaveBeenCalledWith('legacy.job');
  });

  it('enqueues a one-off run with retry options', async () => {
    const { producer, add } = buildQueue();

    await producer.enqueueNow('contests.finalize');

    expect(add).toHaveBeenCalledWith(
      'contests.finalize',
      {},
      expect.objectContaining({ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }),
    );
  });
});

import { Job } from 'bullmq';
import { ScheduledJobsProcessor } from './scheduled-jobs.processor';
import { ScheduledJobRunner } from '../../application/scheduled-job-runner.service';
import { ScheduledJobData } from '../../../queues/domain/interfaces/scheduled-job-queue.interface';

function buildProcessor(): { processor: ScheduledJobsProcessor; run: jest.Mock } {
  const run = jest.fn().mockResolvedValue(7);
  return {
    processor: new ScheduledJobsProcessor({ run } as unknown as ScheduledJobRunner),
    run,
  };
}

const jobNamed = (name: string): Job<ScheduledJobData> =>
  ({ name, data: {}, attemptsMade: 1 }) as Job<ScheduledJobData>;

describe('ScheduledJobsProcessor', () => {
  it('delegates known jobs to the runner', async () => {
    const { processor, run } = buildProcessor();

    await expect(processor.process(jobNamed('contests.finalize'))).resolves.toBe(7);

    expect(run).toHaveBeenCalledWith('contests.finalize');
  });

  it('ignores unknown job names', async () => {
    const { processor, run } = buildProcessor();

    await expect(processor.process(jobNamed('unknown.job'))).resolves.toBe(0);

    expect(run).not.toHaveBeenCalled();
  });

  it('logs failures without throwing', () => {
    const { processor } = buildProcessor();

    expect(() =>
      processor.onFailed(jobNamed('streaks.expire'), new Error('timeout')),
    ).not.toThrow();
  });
});

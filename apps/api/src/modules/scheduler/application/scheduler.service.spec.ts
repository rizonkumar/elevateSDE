import { SchedulerService } from './scheduler.service';
import { IScheduledJobQueue } from '../../queues/domain/interfaces/scheduled-job-queue.interface';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import { SCHEDULED_JOB_NAMES, SCHEDULED_JOBS } from '../domain/scheduled-jobs';

describe('SchedulerService', () => {
  let enqueueNow: jest.Mock;
  let createAuditLog: jest.Mock;
  let service: SchedulerService;

  beforeEach(() => {
    enqueueNow = jest.fn().mockResolvedValue(undefined);
    createAuditLog = jest.fn().mockResolvedValue(undefined);
    service = new SchedulerService(
      { enqueueNow } as unknown as IScheduledJobQueue,
      { create: createAuditLog } as unknown as AuditLogService,
    );
  });

  it('lists every job with its schedule', () => {
    const jobs = service.listJobs();

    expect(jobs.map((job) => job.name)).toEqual(SCHEDULED_JOB_NAMES);
    expect(jobs.find((job) => job.name === SCHEDULED_JOBS.FINALIZE_CONTESTS)?.pattern).toBe(
      '*/5 * * * *',
    );
  });

  it('queues a one-off run and records who triggered it', async () => {
    const view = await service.trigger(SCHEDULED_JOBS.EXPIRE_STREAKS, 'admin-1');

    expect(enqueueNow).toHaveBeenCalledWith('streaks.expire');
    expect(createAuditLog).toHaveBeenCalledWith('admin-1', 'SCHEDULED_JOB_TRIGGERED', {
      job: 'streaks.expire',
    });
    expect(view).toEqual({ name: 'streaks.expire', pattern: '5 0 * * *' });
  });
});

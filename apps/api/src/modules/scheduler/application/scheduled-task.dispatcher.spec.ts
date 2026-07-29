import { ScheduledTaskDispatcher } from './scheduled-task.dispatcher';
import { SCHEDULED_TASKS, ScheduledTask } from '../domain/scheduled-task';
import { ScoringService } from '../../scoring/application/scoring.service';
import { ContestService } from '../../contest/application/contest.service';
import { OrganizationService } from '../../organization/application/organization.service';

const NOW = new Date('2026-07-29T00:00:00.000Z');

function buildDispatcher(): {
  dispatcher: ScheduledTaskDispatcher;
  recomputeWeeklyBucket: jest.Mock;
  recomputeMonthlyBucket: jest.Mock;
  syncStatuses: jest.Mock;
  expireStaleInvitations: jest.Mock;
} {
  const recomputeWeeklyBucket = jest.fn().mockResolvedValue(3);
  const recomputeMonthlyBucket = jest.fn().mockResolvedValue(4);
  const syncStatuses = jest.fn().mockResolvedValue({ toLive: 1, toEnded: 2 });
  const expireStaleInvitations = jest.fn().mockResolvedValue(5);
  const scoringService = {
    recomputeWeeklyBucket,
    recomputeMonthlyBucket,
  } as unknown as ScoringService;
  const contestService = { syncStatuses } as unknown as ContestService;
  const organizationService = { expireStaleInvitations } as unknown as OrganizationService;
  return {
    dispatcher: new ScheduledTaskDispatcher(scoringService, contestService, organizationService),
    recomputeWeeklyBucket,
    recomputeMonthlyBucket,
    syncStatuses,
    expireStaleInvitations,
  };
}

describe('ScheduledTaskDispatcher', () => {
  it('routes the weekly rollover to scoring only', async () => {
    const { dispatcher, recomputeWeeklyBucket, recomputeMonthlyBucket, syncStatuses } =
      buildDispatcher();

    await dispatcher.run(SCHEDULED_TASKS.WEEKLY_POINTS_ROLLOVER, NOW);

    expect(recomputeWeeklyBucket).toHaveBeenCalledWith(NOW);
    expect(recomputeMonthlyBucket).not.toHaveBeenCalled();
    expect(syncStatuses).not.toHaveBeenCalled();
  });

  it('routes the monthly rollover to scoring only', async () => {
    const { dispatcher, recomputeMonthlyBucket, recomputeWeeklyBucket } = buildDispatcher();

    await dispatcher.run(SCHEDULED_TASKS.MONTHLY_POINTS_ROLLOVER, NOW);

    expect(recomputeMonthlyBucket).toHaveBeenCalledWith(NOW);
    expect(recomputeWeeklyBucket).not.toHaveBeenCalled();
  });

  it('routes the contest sweep to the contest service only', async () => {
    const { dispatcher, syncStatuses, expireStaleInvitations } = buildDispatcher();

    await dispatcher.run(SCHEDULED_TASKS.CONTEST_STATUS_SYNC, NOW);

    expect(syncStatuses).toHaveBeenCalledWith(NOW);
    expect(expireStaleInvitations).not.toHaveBeenCalled();
  });

  it('routes the invitation sweep to the organization service only', async () => {
    const { dispatcher, expireStaleInvitations, syncStatuses } = buildDispatcher();

    await dispatcher.run(SCHEDULED_TASKS.INVITATION_EXPIRY_SWEEP, NOW);

    expect(expireStaleInvitations).toHaveBeenCalledWith(NOW);
    expect(syncStatuses).not.toHaveBeenCalled();
  });

  it('throws on an unrecognised task so the job fails visibly', async () => {
    const { dispatcher } = buildDispatcher();

    await expect(dispatcher.run('not-a-task' as ScheduledTask, NOW)).rejects.toThrow(
      'Unknown scheduled task: not-a-task',
    );
  });
});

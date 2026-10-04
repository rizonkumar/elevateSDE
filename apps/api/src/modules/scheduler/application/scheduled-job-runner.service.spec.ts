import { ScheduledJobRunner } from './scheduled-job-runner.service';
import { PointsService } from '../../leaderboard/application/points.service';
import { DailyChallengeService } from '../../daily-challenge/application/daily-challenge.service';
import { ContestFinalizationService } from '../../contest/application/contest-finalization.service';
import { PeerPracticeService } from '../../interview-preparation/application/peer-practice.service';
import { SCHEDULED_JOBS, ScheduledJobName } from '../domain/scheduled-jobs';

function buildRunner(): { runner: ScheduledJobRunner; handlers: Record<string, jest.Mock> } {
  const refreshPeriodTotals = jest.fn((period: string) =>
    Promise.resolve(period === 'weekly' ? 1 : 2),
  );
  const handlers = {
    refreshPeriodTotals,
    expireStreaks: jest.fn().mockResolvedValue(3),
    finalizeEnded: jest.fn().mockResolvedValue(4),
    sweepPreparationReminders: jest.fn().mockResolvedValue(5),
  };
  const runner = new ScheduledJobRunner(
    { refreshPeriodTotals } as unknown as PointsService,
    { expireStreaks: handlers.expireStreaks } as unknown as DailyChallengeService,
    { finalizeEnded: handlers.finalizeEnded } as unknown as ContestFinalizationService,
    {
      sweepPreparationReminders: handlers.sweepPreparationReminders,
    } as unknown as PeerPracticeService,
  );
  return { runner, handlers };
}

describe('ScheduledJobRunner', () => {
  it.each<[ScheduledJobName, 'weekly' | 'monthly', number]>([
    [SCHEDULED_JOBS.ROLLOVER_WEEKLY_POINTS, 'weekly', 1],
    [SCHEDULED_JOBS.ROLLOVER_MONTHLY_POINTS, 'monthly', 2],
  ])('dispatches %s to a %s totals refresh', async (jobName, period, affected) => {
    const { runner, handlers } = buildRunner();

    await expect(runner.run(jobName)).resolves.toBe(affected);

    expect(handlers.refreshPeriodTotals).toHaveBeenCalledWith(period);
  });

  it.each<[ScheduledJobName, string, number]>([
    [SCHEDULED_JOBS.EXPIRE_STREAKS, 'expireStreaks', 3],
    [SCHEDULED_JOBS.FINALIZE_CONTESTS, 'finalizeEnded', 4],
    [SCHEDULED_JOBS.SWEEP_PREPARATION_REMINDERS, 'sweepPreparationReminders', 5],
  ])('dispatches %s to %s', async (jobName, handlerName, affected) => {
    const { runner, handlers } = buildRunner();

    await expect(runner.run(jobName)).resolves.toBe(affected);

    expect(handlers[handlerName]).toHaveBeenCalledTimes(1);
    const otherCalls = Object.entries(handlers)
      .filter(([name]) => name !== handlerName)
      .map(([, handler]) => handler.mock.calls.length);
    expect(otherCalls.every((count) => count === 0)).toBe(true);
  });

  it('propagates handler failures so the queue can retry', async () => {
    const { runner, handlers } = buildRunner();
    handlers.finalizeEnded?.mockRejectedValue(new Error('deadlock'));

    await expect(runner.run(SCHEDULED_JOBS.FINALIZE_CONTESTS)).rejects.toThrow('deadlock');
  });
});

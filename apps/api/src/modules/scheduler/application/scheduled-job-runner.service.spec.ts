import { ScheduledJobRunner } from './scheduled-job-runner.service';
import { PointsService } from '../../leaderboard/application/points.service';
import { DailyChallengeService } from '../../daily-challenge/application/daily-challenge.service';
import { ContestFinalizationService } from '../../contest/application/contest-finalization.service';
import { ContestRatingService } from '../../contest/application/contest-rating.service';
import { ContestLifecycleBroadcaster } from '../../contest/application/contest-lifecycle-broadcaster.service';
import { PeerPracticeService } from '../../interview-preparation/application/peer-practice.service';
import { AuthService } from '../../auth/auth.service';
import { MockInterviewService } from '../../mock-interview/application/mock-interview.service';
import { SCHEDULED_JOBS, ScheduledJobName } from '../domain/scheduled-jobs';

function buildRunner(): {
  runner: ScheduledJobRunner;
  handlers: Record<string, jest.Mock>;
  ratePending: jest.Mock;
} {
  const refreshPeriodTotals = jest.fn((period: string) =>
    Promise.resolve(period === 'weekly' ? 1 : 2),
  );
  const handlers = {
    refreshPeriodTotals,
    expireStreaks: jest.fn().mockResolvedValue(3),
    finalizeEnded: jest.fn().mockResolvedValue(4),
    broadcastRecent: jest.fn().mockResolvedValue(8),
    sweepPreparationReminders: jest.fn().mockResolvedValue(5),
    pruneExpiredRefreshTokens: jest.fn().mockResolvedValue(6),
    sweep: jest.fn().mockResolvedValue(7),
  };
  const ratePending = jest.fn().mockResolvedValue(0);
  const runner = new ScheduledJobRunner(
    { refreshPeriodTotals } as unknown as PointsService,
    { expireStreaks: handlers.expireStreaks } as unknown as DailyChallengeService,
    { finalizeEnded: handlers.finalizeEnded } as unknown as ContestFinalizationService,
    { ratePending } as unknown as ContestRatingService,
    { broadcastRecent: handlers.broadcastRecent } as unknown as ContestLifecycleBroadcaster,
    {
      sweepPreparationReminders: handlers.sweepPreparationReminders,
    } as unknown as PeerPracticeService,
    {
      pruneExpiredRefreshTokens: handlers.pruneExpiredRefreshTokens,
    } as unknown as AuthService,
    { sweep: handlers.sweep } as unknown as MockInterviewService,
  );
  return { runner, handlers, ratePending };
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
    [SCHEDULED_JOBS.BROADCAST_CONTEST_STATUS, 'broadcastRecent', 8],
    [SCHEDULED_JOBS.SWEEP_PREPARATION_REMINDERS, 'sweepPreparationReminders', 5],
    [SCHEDULED_JOBS.PRUNE_REFRESH_TOKENS, 'pruneExpiredRefreshTokens', 6],
    [SCHEDULED_JOBS.SWEEP_MOCK_INTERVIEWS, 'sweep', 7],
  ])('dispatches %s to %s', async (jobName, handlerName, affected) => {
    const { runner, handlers } = buildRunner();

    await expect(runner.run(jobName)).resolves.toBe(affected);

    expect(handlers[handlerName]).toHaveBeenCalledTimes(1);
    const otherCalls = Object.entries(handlers)
      .filter(([name]) => name !== handlerName)
      .map(([, handler]) => handler.mock.calls.length);
    expect(otherCalls.every((count) => count === 0)).toBe(true);
  });

  it('rates finalized contests right after finalizing them', async () => {
    const { runner, handlers, ratePending } = buildRunner();
    ratePending.mockResolvedValue(2);

    await expect(runner.run(SCHEDULED_JOBS.FINALIZE_CONTESTS)).resolves.toBe(6);

    expect(ratePending).toHaveBeenCalledTimes(1);
    const finalizeOrder = handlers.finalizeEnded?.mock.invocationCallOrder[0] ?? 0;
    expect(ratePending.mock.invocationCallOrder[0]).toBeGreaterThan(finalizeOrder);
  });

  it('propagates handler failures so the queue can retry', async () => {
    const { runner, handlers } = buildRunner();
    handlers.finalizeEnded?.mockRejectedValue(new Error('deadlock'));

    await expect(runner.run(SCHEDULED_JOBS.FINALIZE_CONTESTS)).rejects.toThrow('deadlock');
  });
});

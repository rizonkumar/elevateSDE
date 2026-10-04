import { NotFoundException } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { PointsService } from './points.service';
import { ILeaderboardRepository } from '../domain/interfaces/leaderboard-repository.interface';
import { UserStats } from '../domain/entities/user-stats';
import { LeaderboardEntryView } from '../domain/read-models/leaderboard-entry-view';
import { LeaderboardScope } from '../domain/leaderboard-scope';
import { LeaderboardTimeframe } from '@elevatesde/shared-types';

const STATS = UserStats.reconstitute('user-1', { badges: ['first-blood'] });

const VIEW = (userId: string): LeaderboardEntryView => ({
  userId,
  firstName: 'Ada',
  lastName: 'Lovelace',
  headline: null,
  points: 10,
  assessmentsCompleted: 1,
  badges: [],
  streakDays: 0,
});

class FakeLeaderboardRepository implements ILeaderboardRepository {
  stats: UserStats | null = STATS;
  savedBadges: string[] | null = null;
  views: LeaderboardEntryView[] = [];
  queries: Array<{ timeframe: LeaderboardTimeframe; scope: LeaderboardScope }> = [];

  async listByTimeframe(
    timeframe: LeaderboardTimeframe,
    scope: LeaderboardScope,
  ): Promise<LeaderboardEntryView[]> {
    this.queries.push({ timeframe, scope });
    return this.views;
  }

  async findByUser(): Promise<UserStats | null> {
    return this.stats;
  }

  async saveBadges(stats: UserStats): Promise<void> {
    this.savedBadges = stats.getBadges();
  }
}

describe('LeaderboardService', () => {
  let repository: FakeLeaderboardRepository;
  let adjustTo: jest.Mock;
  let service: LeaderboardService;

  beforeEach(() => {
    repository = new FakeLeaderboardRepository();
    adjustTo = jest.fn().mockResolvedValue(true);
    service = new LeaderboardService(repository, { adjustTo } as unknown as PointsService);
  });

  describe('getStandingsFor', () => {
    const viewer = (tenantId: string | null) => ({
      getId: () => 'u2',
      getTenantId: () => tenantId,
    });

    it('limits organization members to their own tenant', async () => {
      await service.getStandingsFor(viewer('tenant-1'), 'weekly');

      expect(repository.queries).toEqual([
        { timeframe: 'weekly', scope: { kind: 'tenant', tenantId: 'tenant-1' } },
      ]);
    });

    it('limits individual candidates to members without an organization', async () => {
      await service.getStandingsFor(viewer(null), 'all-time');

      expect(repository.queries[0]?.scope).toEqual({ kind: 'tenant', tenantId: null });
    });

    it('ranks entries in order and flags the viewer', async () => {
      repository.views = [VIEW('u1'), VIEW('u2')];

      const standings = await service.getStandingsFor(viewer(null), 'all-time');

      expect(standings.map((entry) => [entry.rank, entry.isCurrentUser])).toEqual([
        [1, false],
        [2, true],
      ]);
    });
  });

  describe('getPlatformStandings', () => {
    it('lets platform admins see every member', async () => {
      await service.getPlatformStandings('admin-1');

      expect(repository.queries[0]).toEqual({
        timeframe: 'all-time',
        scope: { kind: 'platform' },
      });
    });
  });

  describe('adjustPoints', () => {
    it('delegates the absolute target to the points ledger', async () => {
      await service.adjustPoints('admin-1', 'user-1', 200, ['first-blood']);

      expect(adjustTo).toHaveBeenCalledWith('user-1', 200);
    });

    it('returns platform-wide standings after the adjustment', async () => {
      await service.adjustPoints('admin-1', 'user-1', 200, []);

      expect(repository.queries[0]?.scope).toEqual({ kind: 'platform' });
    });

    it('persists normalized badges', async () => {
      await service.adjustPoints('admin-1', 'user-1', 120, [' Top Mentor ', 'Top Mentor', '']);

      expect(repository.savedBadges).toEqual(['Top Mentor']);
    });

    it('throws when the member has no leaderboard entry', async () => {
      repository.stats = null;

      await expect(service.adjustPoints('admin-1', 'missing', 10, [])).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(adjustTo).not.toHaveBeenCalled();
    });
  });
});

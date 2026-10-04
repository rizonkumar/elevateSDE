import { NotFoundException } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { PointsService } from './points.service';
import { ILeaderboardRepository } from '../domain/interfaces/leaderboard-repository.interface';
import { UserStats } from '../domain/entities/user-stats';
import { LeaderboardEntryView } from '../domain/read-models/leaderboard-entry-view';

const STATS = UserStats.reconstitute('user-1', { badges: ['first-blood'] });

class FakeLeaderboardRepository implements ILeaderboardRepository {
  stats: UserStats | null = STATS;
  savedBadges: string[] | null = null;
  views: LeaderboardEntryView[] = [];

  async listByTimeframe(): Promise<LeaderboardEntryView[]> {
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

  describe('adjustPoints', () => {
    it('delegates the absolute target to the points ledger', async () => {
      await service.adjustPoints('admin-1', 'user-1', 200, ['first-blood']);

      expect(adjustTo).toHaveBeenCalledWith('user-1', 200);
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

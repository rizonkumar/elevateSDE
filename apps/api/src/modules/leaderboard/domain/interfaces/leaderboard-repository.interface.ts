import { LeaderboardTimeframe } from '@elevatesde/shared-types';
import { UserStats } from '../entities/user-stats';
import { LeaderboardEntryView } from '../read-models/leaderboard-entry-view';
import { LeaderboardScope } from '../leaderboard-scope';

export abstract class ILeaderboardRepository {
  abstract listByTimeframe(
    timeframe: LeaderboardTimeframe,
    scope: LeaderboardScope,
  ): Promise<LeaderboardEntryView[]>;
  abstract findByUser(userId: string): Promise<UserStats | null>;
  abstract saveBadges(stats: UserStats): Promise<void>;
}

import { LeaderboardTimeframe } from '@elevatesde/shared-types';
import { UserStats } from '../entities/user-stats';
import { LeaderboardEntryView } from '../read-models/leaderboard-entry-view';

export abstract class ILeaderboardRepository {
  abstract listByTimeframe(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntryView[]>;
  abstract findByUser(userId: string): Promise<UserStats | null>;
  abstract save(stats: UserStats): Promise<void>;
}

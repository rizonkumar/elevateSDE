import { Injectable, NotFoundException } from '@nestjs/common';
import { LeaderboardTimeframe } from '@elevatesde/shared-types';
import { ILeaderboardRepository } from '../domain/interfaces/leaderboard-repository.interface';
import { RankedLeaderboardEntry } from '../domain/read-models/leaderboard-entry-view';

@Injectable()
export class LeaderboardService {
  constructor(private readonly leaderboardRepository: ILeaderboardRepository) {}

  async getStandings(
    timeframe: LeaderboardTimeframe,
    viewerId: string,
  ): Promise<RankedLeaderboardEntry[]> {
    const views = await this.leaderboardRepository.listByTimeframe(timeframe);
    return views.map((view, index) => ({
      view,
      rank: index + 1,
      isCurrentUser: view.userId === viewerId,
    }));
  }

  async adjustPoints(
    viewerId: string,
    userId: string,
    points: number,
    badges: string[],
  ): Promise<RankedLeaderboardEntry[]> {
    const stats = await this.leaderboardRepository.findByUser(userId);
    if (!stats) {
      throw new NotFoundException('Leaderboard entry not found');
    }
    await this.leaderboardRepository.save(stats.adjust(points, badges));
    return this.getStandings('all-time', viewerId);
  }
}

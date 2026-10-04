import { Injectable, NotFoundException } from '@nestjs/common';
import { LeaderboardTimeframe } from '@elevatesde/shared-types';
import { ILeaderboardRepository } from '../domain/interfaces/leaderboard-repository.interface';
import { RankedLeaderboardEntry } from '../domain/read-models/leaderboard-entry-view';
import { PointsService } from './points.service';
import {
  LeaderboardScope,
  LeaderboardViewer,
  PLATFORM_SCOPE,
  scopeForViewer,
} from '../domain/leaderboard-scope';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly leaderboardRepository: ILeaderboardRepository,
    private readonly pointsService: PointsService,
  ) {}

  async getStandingsFor(
    viewer: LeaderboardViewer,
    timeframe: LeaderboardTimeframe,
  ): Promise<RankedLeaderboardEntry[]> {
    return this.rank(timeframe, viewer.getId(), scopeForViewer(viewer));
  }

  async getPlatformStandings(viewerId: string): Promise<RankedLeaderboardEntry[]> {
    return this.rank('all-time', viewerId, PLATFORM_SCOPE);
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
    await this.pointsService.adjustTo(userId, points);
    await this.leaderboardRepository.saveBadges(stats.withBadges(badges));
    return this.getPlatformStandings(viewerId);
  }

  private async rank(
    timeframe: LeaderboardTimeframe,
    viewerId: string,
    scope: LeaderboardScope,
  ): Promise<RankedLeaderboardEntry[]> {
    const views = await this.leaderboardRepository.listByTimeframe(timeframe, scope);
    return views.map((view, index) => ({
      view,
      rank: index + 1,
      isCurrentUser: view.userId === viewerId,
    }));
  }
}

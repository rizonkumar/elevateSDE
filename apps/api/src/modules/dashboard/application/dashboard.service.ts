import { Injectable } from '@nestjs/common';
import { IDashboardRepository } from '../domain/interfaces/dashboard-repository.interface';
import {
  DashboardStatsView,
  SubmissionHeatmapCell,
} from '../domain/read-models/dashboard-stats-view';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: IDashboardRepository) {}

  async getStats(userId: string): Promise<DashboardStatsView> {
    return this.dashboardRepository.getStats(userId);
  }

  async getSubmissionHeatmap(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<SubmissionHeatmapCell[]> {
    return this.dashboardRepository.getSubmissionHeatmap(userId, from, to);
  }
}

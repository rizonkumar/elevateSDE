import { DashboardStatsView, SubmissionHeatmapCell } from '../read-models/dashboard-stats-view';

export abstract class IDashboardRepository {
  abstract getStats(userId: string): Promise<DashboardStatsView>;
  abstract getSubmissionHeatmap(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<SubmissionHeatmapCell[]>;
}

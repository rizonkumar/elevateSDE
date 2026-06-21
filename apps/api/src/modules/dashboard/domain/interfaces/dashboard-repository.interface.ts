import { DashboardStatsView } from '../read-models/dashboard-stats-view';

export abstract class IDashboardRepository {
  abstract getStats(userId: string): Promise<DashboardStatsView>;
}

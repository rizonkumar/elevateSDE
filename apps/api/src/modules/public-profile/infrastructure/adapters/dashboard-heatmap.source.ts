import { Injectable } from '@nestjs/common';
import { DashboardService } from '../../../dashboard/application/dashboard.service';
import { IProfileHeatmapSource } from '../../domain/interfaces/profile-heatmap-source.interface';
import { HeatmapCell } from '../../domain/read-models/public-profile';

@Injectable()
export class DashboardHeatmapSource implements IProfileHeatmapSource {
  constructor(private readonly dashboardService: DashboardService) {}

  async getHeatmap(userId: string, from: Date, to: Date): Promise<HeatmapCell[]> {
    return this.dashboardService.getSubmissionHeatmap(userId, from, to);
  }
}

import { HeatmapCell } from '../read-models/public-profile';

export abstract class IProfileHeatmapSource {
  abstract getHeatmap(userId: string, from: Date, to: Date): Promise<HeatmapCell[]>;
}

import type { DashboardStatsDto } from '@elevatesde/shared-types';
import { api } from './api';

export async function getDashboardStats(): Promise<DashboardStatsDto> {
  const response = await api.get<DashboardStatsDto>('/api/v1/users/me/dashboard-stats');
  return response.data;
}

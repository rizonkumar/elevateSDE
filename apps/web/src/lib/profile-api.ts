import type {
  StreakSummaryDto,
  SubmissionHeatmapDto,
  UserDto,
} from '@elevatesde/shared-types';
import { api } from './api';

export async function getMe(): Promise<UserDto> {
  const response = await api.get<UserDto>('/api/v1/users/me');
  return response.data;
}

export async function getStreakSummary(): Promise<StreakSummaryDto> {
  const response = await api.get<StreakSummaryDto>('/api/v1/daily-challenge/streak');
  return response.data;
}

export async function getSubmissionHeatmap(): Promise<SubmissionHeatmapDto> {
  const response = await api.get<SubmissionHeatmapDto>('/api/v1/users/me/submission-heatmap');
  return response.data;
}

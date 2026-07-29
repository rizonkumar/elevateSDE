import type {
  HandleAvailabilityDto,
  NotificationPreferenceDto,
  StreakSummaryDto,
  SubmissionHeatmapDto,
  UpdateNotificationPreferenceDto,
  UpdateProfileDto,
  UserDto,
} from '@elevatesde/shared-types';
import { api } from './api';

export async function getMe(): Promise<UserDto> {
  const response = await api.get<UserDto>('/api/v1/users/me');
  return response.data;
}

export async function updateProfile(dto: UpdateProfileDto): Promise<UserDto> {
  const response = await api.patch<UserDto>('/api/v1/users/me', dto);
  return response.data;
}

export async function checkHandleAvailability(handle: string): Promise<HandleAvailabilityDto> {
  const response = await api.get<HandleAvailabilityDto>('/api/v1/users/handle-available', {
    params: { handle },
  });
  return response.data;
}

export async function getNotificationPreferences(): Promise<NotificationPreferenceDto[]> {
  const response = await api.get<NotificationPreferenceDto[]>('/api/v1/notifications/preferences');
  return response.data;
}

export async function updateNotificationPreference(
  dto: UpdateNotificationPreferenceDto,
): Promise<NotificationPreferenceDto[]> {
  const response = await api.patch<NotificationPreferenceDto[]>(
    '/api/v1/notifications/preferences',
    dto,
  );
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

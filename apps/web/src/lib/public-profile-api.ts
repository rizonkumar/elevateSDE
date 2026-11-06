import axios from 'axios';
import type {
  HandleAvailabilityDto,
  PublicProfileSettingsDto,
  UpdatePublicProfileRequest,
} from '@elevatesde/shared-types';
import { api } from './api';

export async function getPublicProfileSettings(): Promise<PublicProfileSettingsDto> {
  const response = await api.get<PublicProfileSettingsDto>('/api/v1/users/me/public-profile');
  return response.data;
}

export async function updatePublicProfileSettings(
  request: UpdatePublicProfileRequest,
): Promise<PublicProfileSettingsDto> {
  const response = await api.patch<PublicProfileSettingsDto>(
    '/api/v1/users/me/public-profile',
    request,
  );
  return response.data;
}

export async function checkHandleAvailability(handle: string): Promise<HandleAvailabilityDto> {
  const response = await api.get<HandleAvailabilityDto>('/api/v1/users/me/handle-availability', {
    params: { handle },
  });
  return response.data;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<{ message?: string | string[] }>(error)) {
    return fallback;
  }
  const message = error.response?.data?.message;
  if (Array.isArray(message)) {
    return message[0] ?? fallback;
  }
  return message ?? fallback;
}

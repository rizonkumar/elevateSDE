import type {
  PendingAccountCountDto,
  PendingAccountListDto,
  UserDto,
} from '@elevatesde/shared-types';
import { api } from './api';

const BASE_PATH = '/api/v1/admin/users';

export async function fetchPendingAccounts(): Promise<PendingAccountListDto> {
  const response = await api.get<PendingAccountListDto>(`${BASE_PATH}/pending`, {
    params: { page: 1, pageSize: 100 },
  });
  return response.data;
}

export async function fetchPendingAccountCount(): Promise<number> {
  const response = await api.get<PendingAccountCountDto>(`${BASE_PATH}/pending-count`);
  return response.data.count;
}

export async function approveAccount(userId: string): Promise<UserDto> {
  const response = await api.patch<UserDto>(`${BASE_PATH}/${userId}/approve`);
  return response.data;
}

export async function rejectAccount(userId: string, reason: string): Promise<UserDto> {
  const trimmed = reason.trim();
  const response = await api.patch<UserDto>(
    `${BASE_PATH}/${userId}/reject`,
    trimmed ? { reason: trimmed } : {},
  );
  return response.data;
}

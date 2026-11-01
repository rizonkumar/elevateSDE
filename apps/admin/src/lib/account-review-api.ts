import type {
  PendingAccountCountDto,
  PendingAccountListDto,
  UserDto,
} from '@elevatesde/shared-types';
import { api } from './api';

const BASE_PATH = '/api/v1/admin/users';

export const PENDING_PAGE_SIZE = 50;

export async function fetchPendingAccounts(page: number): Promise<PendingAccountListDto> {
  const response = await api.get<PendingAccountListDto>(`${BASE_PATH}/pending`, {
    params: { page, pageSize: PENDING_PAGE_SIZE },
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

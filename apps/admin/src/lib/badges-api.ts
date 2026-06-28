import type {
  AdminBadgeDto,
  CreateBadgeDto,
  GrantBadgeDto,
  UserDto,
} from '@elevatesde/shared-types';
import { api } from './api';

const BASE_PATH = '/api/v1/admin/badges';

export async function fetchBadges(): Promise<AdminBadgeDto[]> {
  const response = await api.get<AdminBadgeDto[]>(BASE_PATH);
  return response.data;
}

export async function createBadge(input: CreateBadgeDto): Promise<AdminBadgeDto> {
  const response = await api.post<AdminBadgeDto>(BASE_PATH, input);
  return response.data;
}

export async function updateBadge(id: string, input: CreateBadgeDto): Promise<AdminBadgeDto> {
  const response = await api.patch<AdminBadgeDto>(`${BASE_PATH}/${id}`, input);
  return response.data;
}

export async function deleteBadge(id: string): Promise<void> {
  await api.delete(`${BASE_PATH}/${id}`);
}

export async function grantBadge(input: GrantBadgeDto): Promise<void> {
  await api.post(`${BASE_PATH}/grant`, input);
}

export async function revokeBadge(input: GrantBadgeDto): Promise<void> {
  await api.post(`${BASE_PATH}/revoke`, input);
}

export async function fetchUsers(): Promise<UserDto[]> {
  const response = await api.get<UserDto[]>('/api/v1/admin/users');
  return response.data;
}

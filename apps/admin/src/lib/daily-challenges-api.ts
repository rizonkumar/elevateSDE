import type { CreateDailyChallengeDto, DailyChallengeScheduleDto } from '@elevatesde/shared-types';
import { api } from './api';

const BASE_PATH = '/api/v1/admin/daily-challenges';

export interface ScheduleRangeParams {
  from?: string;
  to?: string;
}

export async function fetchSchedule(
  params: ScheduleRangeParams,
): Promise<DailyChallengeScheduleDto[]> {
  const response = await api.get<DailyChallengeScheduleDto[]>(BASE_PATH, { params });
  return response.data;
}

export async function createDailyChallenge(
  input: CreateDailyChallengeDto,
): Promise<DailyChallengeScheduleDto> {
  const response = await api.post<DailyChallengeScheduleDto>(BASE_PATH, input);
  return response.data;
}

export async function deleteDailyChallenge(id: string): Promise<void> {
  await api.delete(`${BASE_PATH}/${id}`);
}

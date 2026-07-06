import type {
  AdminContestDetailDto,
  AdminContestInput,
  AdminContestListDto,
  SetContestProblemsInput,
} from '@elevatesde/shared-types';
import { api } from './api';

const BASE_PATH = '/api/v1/admin/contests';

export async function fetchContests(): Promise<AdminContestListDto> {
  const response = await api.get<AdminContestListDto>(BASE_PATH);
  return response.data;
}

export async function fetchContest(id: string): Promise<AdminContestDetailDto> {
  const response = await api.get<AdminContestDetailDto>(`${BASE_PATH}/${id}`);
  return response.data;
}

export async function createContest(input: AdminContestInput): Promise<AdminContestDetailDto> {
  const response = await api.post<AdminContestDetailDto>(BASE_PATH, input);
  return response.data;
}

export async function updateContest(
  id: string,
  input: AdminContestInput,
): Promise<AdminContestDetailDto> {
  const response = await api.patch<AdminContestDetailDto>(`${BASE_PATH}/${id}`, input);
  return response.data;
}

export async function setContestProblems(
  id: string,
  input: SetContestProblemsInput,
): Promise<AdminContestDetailDto> {
  const response = await api.post<AdminContestDetailDto>(`${BASE_PATH}/${id}/problems`, input);
  return response.data;
}

export async function setContestPublished(
  id: string,
  publish: boolean,
): Promise<AdminContestDetailDto> {
  const response = await api.patch<AdminContestDetailDto>(`${BASE_PATH}/${id}/publish`, {
    publish,
  });
  return response.data;
}

export async function deleteContest(id: string): Promise<void> {
  await api.delete(`${BASE_PATH}/${id}`);
}

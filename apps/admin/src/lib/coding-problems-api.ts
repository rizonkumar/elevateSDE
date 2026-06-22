import type { CodingProblemDto, ProblemListDto } from '@elevatesde/shared-types';
import { api } from './api';

const MAX_PAGE_SIZE = 100;

export async function fetchProblemList(): Promise<ProblemListDto> {
  const response = await api.get<ProblemListDto>('/api/v1/problems', {
    params: { pageSize: MAX_PAGE_SIZE },
  });
  return response.data;
}

export async function fetchProblem(id: string): Promise<CodingProblemDto> {
  const response = await api.get<CodingProblemDto>(`/api/v1/problems/${id}`);
  return response.data;
}

import type {
  AdminCodingProblemDto,
  AdminCodingProblemInput,
  AdminProblemListDto,
  AssessmentDifficulty,
} from '@elevatesde/shared-types';
import { api } from './api';

const BASE_PATH = '/api/v1/admin/coding-problems';

export interface ProblemListParams {
  page: number;
  pageSize: number;
  search?: string;
  difficulty?: AssessmentDifficulty;
  hasTestCases?: boolean;
}

export async function fetchProblemList(params: ProblemListParams): Promise<AdminProblemListDto> {
  const response = await api.get<AdminProblemListDto>(BASE_PATH, { params });
  return response.data;
}

export async function fetchProblem(id: string): Promise<AdminCodingProblemDto> {
  const response = await api.get<AdminCodingProblemDto>(`${BASE_PATH}/${id}`);
  return response.data;
}

export async function createProblem(
  input: AdminCodingProblemInput,
): Promise<AdminCodingProblemDto> {
  const response = await api.post<AdminCodingProblemDto>(BASE_PATH, input);
  return response.data;
}

export async function updateProblem(
  id: string,
  input: AdminCodingProblemInput,
): Promise<AdminCodingProblemDto> {
  const response = await api.patch<AdminCodingProblemDto>(`${BASE_PATH}/${id}`, input);
  return response.data;
}

export async function setProblemPublished(
  id: string,
  isPublished: boolean,
): Promise<AdminCodingProblemDto> {
  const response = await api.patch<AdminCodingProblemDto>(`${BASE_PATH}/${id}/publish`, {
    isPublished,
  });
  return response.data;
}

export async function deleteProblem(id: string): Promise<void> {
  await api.delete(`${BASE_PATH}/${id}`);
}

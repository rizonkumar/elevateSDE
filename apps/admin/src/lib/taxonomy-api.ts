import type { TopicDto } from '@elevatesde/shared-types';
import { api } from './api';

export type TaxonomyKind = 'topic' | 'company';

const BASE_PATH: Record<TaxonomyKind, string> = {
  topic: '/api/v1/admin/topics',
  company: '/api/v1/admin/companies',
};

export async function fetchTerms(kind: TaxonomyKind): Promise<TopicDto[]> {
  const response = await api.get<TopicDto[]>(BASE_PATH[kind]);
  return response.data;
}

export async function createTerm(kind: TaxonomyKind, name: string): Promise<TopicDto> {
  const response = await api.post<TopicDto>(BASE_PATH[kind], { name });
  return response.data;
}

export async function renameTerm(kind: TaxonomyKind, id: string, name: string): Promise<TopicDto> {
  const response = await api.patch<TopicDto>(`${BASE_PATH[kind]}/${id}`, { name });
  return response.data;
}

export async function deleteTerm(kind: TaxonomyKind, id: string): Promise<void> {
  await api.delete(`${BASE_PATH[kind]}/${id}`);
}

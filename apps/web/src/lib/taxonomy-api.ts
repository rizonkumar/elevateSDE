import type { CompanyDto, TopicDto } from '@elevatesde/shared-types';
import { api } from './api';

export async function listTopics(): Promise<TopicDto[]> {
  const response = await api.get<TopicDto[]>('/api/v1/topics');
  return response.data;
}

export async function listCompanies(): Promise<CompanyDto[]> {
  const response = await api.get<CompanyDto[]>('/api/v1/companies');
  return response.data;
}

export async function getCompany(slug: string): Promise<CompanyDto> {
  const response = await api.get<CompanyDto>(`/api/v1/companies/${encodeURIComponent(slug)}`);
  return response.data;
}

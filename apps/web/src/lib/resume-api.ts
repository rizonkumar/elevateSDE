import type { ResumeDto } from '@elevatesde/shared-types';
import { api } from './api';

export async function uploadResume(file: File): Promise<ResumeDto> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<ResumeDto>('/api/v1/resume', formData);
  return response.data;
}

export async function getResumes(): Promise<ResumeDto[]> {
  const response = await api.get<ResumeDto[]>('/api/v1/resume');
  return response.data;
}

export async function getResume(id: string): Promise<ResumeDto> {
  const response = await api.get<ResumeDto>(`/api/v1/resume/${id}`);
  return response.data;
}

export async function deleteResume(id: string): Promise<void> {
  await api.delete(`/api/v1/resume/${id}`);
}

import type {
  AdminLearningPathDetailDto,
  AdminLearningPathInput,
  AdminLearningPathListDto,
  ReorderDirection,
} from '@elevatesde/shared-types';
import { api } from './api';

const BASE_PATH = '/api/v1/admin/learning-paths';

export async function fetchLearningPaths(): Promise<AdminLearningPathListDto> {
  const response = await api.get<AdminLearningPathListDto>(BASE_PATH);
  return response.data;
}

export async function fetchLearningPath(id: string): Promise<AdminLearningPathDetailDto> {
  const response = await api.get<AdminLearningPathDetailDto>(`${BASE_PATH}/${id}`);
  return response.data;
}

export async function createLearningPath(
  input: AdminLearningPathInput,
): Promise<AdminLearningPathDetailDto> {
  const response = await api.post<AdminLearningPathDetailDto>(BASE_PATH, input);
  return response.data;
}

export async function updateLearningPath(
  id: string,
  input: AdminLearningPathInput,
): Promise<AdminLearningPathDetailDto> {
  const response = await api.patch<AdminLearningPathDetailDto>(`${BASE_PATH}/${id}`, input);
  return response.data;
}

export async function setLearningPathPublished(
  id: string,
  publish: boolean,
): Promise<AdminLearningPathDetailDto> {
  const response = await api.patch<AdminLearningPathDetailDto>(`${BASE_PATH}/${id}/publish`, {
    publish,
  });
  return response.data;
}

export async function deleteLearningPath(id: string): Promise<void> {
  await api.delete(`${BASE_PATH}/${id}`);
}

export async function addLearningPathModule(
  id: string,
  title: string,
): Promise<AdminLearningPathDetailDto> {
  const response = await api.post<AdminLearningPathDetailDto>(`${BASE_PATH}/${id}/modules`, {
    title,
  });
  return response.data;
}

export async function renameLearningPathModule(
  moduleId: string,
  title: string,
): Promise<AdminLearningPathDetailDto> {
  const response = await api.patch<AdminLearningPathDetailDto>(`${BASE_PATH}/modules/${moduleId}`, {
    title,
  });
  return response.data;
}

export async function deleteLearningPathModule(
  moduleId: string,
): Promise<AdminLearningPathDetailDto> {
  const response = await api.delete<AdminLearningPathDetailDto>(
    `${BASE_PATH}/modules/${moduleId}`,
  );
  return response.data;
}

export async function reorderLearningPathModule(
  moduleId: string,
  direction: ReorderDirection,
): Promise<AdminLearningPathDetailDto> {
  const response = await api.patch<AdminLearningPathDetailDto>(
    `${BASE_PATH}/modules/${moduleId}/reorder`,
    { direction },
  );
  return response.data;
}

export async function addLearningPathItem(
  moduleId: string,
  problemId: string,
): Promise<AdminLearningPathDetailDto> {
  const response = await api.post<AdminLearningPathDetailDto>(
    `${BASE_PATH}/modules/${moduleId}/items`,
    { problemId },
  );
  return response.data;
}

export async function deleteLearningPathItem(
  itemId: string,
): Promise<AdminLearningPathDetailDto> {
  const response = await api.delete<AdminLearningPathDetailDto>(`${BASE_PATH}/items/${itemId}`);
  return response.data;
}

export async function reorderLearningPathItem(
  itemId: string,
  direction: ReorderDirection,
): Promise<AdminLearningPathDetailDto> {
  const response = await api.patch<AdminLearningPathDetailDto>(
    `${BASE_PATH}/items/${itemId}/reorder`,
    { direction },
  );
  return response.data;
}

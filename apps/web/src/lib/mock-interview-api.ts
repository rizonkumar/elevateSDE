import axios from 'axios';
import type {
  MockInterviewHistoryDto,
  MockInterviewSessionDto,
  StartMockInterviewDto,
} from '@elevatesde/shared-types';
import { api } from './api';

const BASE_PATH = '/api/v1/mock-interviews';

export async function startMockInterview(input: StartMockInterviewDto): Promise<MockInterviewSessionDto> {
  const response = await api.post<MockInterviewSessionDto>(BASE_PATH, input);
  return response.data;
}

export async function getActiveMockInterview(): Promise<MockInterviewSessionDto | null> {
  const response = await api.get<MockInterviewSessionDto | null>(`${BASE_PATH}/active`);
  return response.data || null;
}

export async function getMockInterview(id: string): Promise<MockInterviewSessionDto> {
  const response = await api.get<MockInterviewSessionDto>(`${BASE_PATH}/${id}`);
  return response.data;
}

export async function answerMockInterview(
  session: MockInterviewSessionDto,
  turnId: string,
  answer: string,
): Promise<MockInterviewSessionDto> {
  const response = await api.post<MockInterviewSessionDto>(
    `${BASE_PATH}/${session.id}/turns/${turnId}/answer`,
    { answer, version: session.version },
  );
  return response.data;
}

export async function endMockInterview(id: string): Promise<MockInterviewSessionDto> {
  const response = await api.post<MockInterviewSessionDto>(`${BASE_PATH}/${id}/end`);
  return response.data;
}

export async function listMockInterviews(cursor: string | null): Promise<MockInterviewHistoryDto> {
  const response = await api.get<MockInterviewHistoryDto>(BASE_PATH, {
    params: cursor ? { cursor } : undefined,
  });
  return response.data;
}

export function mockInterviewErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;
  const message: unknown = error.response?.data?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  return fallback;
}

export function activeSessionIdFrom(error: unknown): string | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return null;
  const id: unknown = error.response.data?.activeSessionId;
  return typeof id === 'string' ? id : null;
}

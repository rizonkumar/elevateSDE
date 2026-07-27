import type {
  GradeReviewDto,
  ReviewItemDto,
  ReviewQuality,
  ReviewSummaryDto,
} from '@elevatesde/shared-types';
import { api } from './api';

export async function getDueReviews(): Promise<ReviewItemDto[]> {
  const response = await api.get<ReviewItemDto[]>('/api/v1/review/due');
  return response.data;
}

export async function getReviewSummary(): Promise<ReviewSummaryDto> {
  const response = await api.get<ReviewSummaryDto>('/api/v1/review/summary');
  return response.data;
}

export async function gradeReview(
  problemId: string,
  quality: ReviewQuality,
): Promise<ReviewItemDto> {
  const body: GradeReviewDto = { quality };
  const response = await api.post<ReviewItemDto>(`/api/v1/review/${problemId}/grade`, body);
  return response.data;
}

import axios from 'axios';
import type {
  AssessmentDifficulty,
  AssessmentRunRequestDto,
  AssessmentRunResultDto,
  AssessmentLanguage,
  CodeReviewQuotaDto,
  CodingProblemDto,
  PerformanceDistributionDto,
  ProblemListDto,
  ProblemProgressStatus,
  SubmissionAcceptedDto,
  SubmissionDetailDto,
  SubmissionPageDto,
  SubmissionReviewDto,
} from '@elevatesde/shared-types';
import { api } from './api';

export interface ListProblemsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  difficulty?: AssessmentDifficulty;
  hasTestCases?: boolean;
  topics?: string[];
  company?: string;
  status?: ProblemProgressStatus;
}

export async function listProblems(params: ListProblemsParams): Promise<ProblemListDto> {
  const { topics, ...rest } = params;
  const response = await api.get<ProblemListDto>('/api/v1/problems', {
    params: { ...rest, topics: topics && topics.length > 0 ? topics.join(',') : undefined },
  });
  return response.data;
}

export async function getProblem(id: string): Promise<CodingProblemDto> {
  const response = await api.get<CodingProblemDto>(`/api/v1/problems/${id}`);
  return response.data;
}

export async function runAssessment(
  payload: AssessmentRunRequestDto,
): Promise<AssessmentRunResultDto> {
  const response = await api.post<AssessmentRunResultDto>('/api/v1/assessments/run', payload);
  return response.data;
}

export async function submitAssessment(
  payload: AssessmentRunRequestDto,
): Promise<SubmissionAcceptedDto> {
  const response = await api.post<SubmissionAcceptedDto>('/api/v1/assessments/submit', payload);
  return response.data;
}

export async function getSubmission(submissionId: string): Promise<SubmissionDetailDto> {
  const response = await api.get<SubmissionDetailDto>(
    `/api/v1/assessments/submissions/${submissionId}`,
  );
  return response.data;
}

export async function listSubmissions(
  problemId: string,
  cursor: string | null,
  limit = 20,
): Promise<SubmissionPageDto> {
  const response = await api.get<SubmissionPageDto>('/api/v1/assessments/submissions', {
    params: { problemId, limit, cursor: cursor ?? undefined },
  });
  return response.data;
}

export async function getPerformanceDistribution(
  problemId: string,
  language: AssessmentLanguage,
): Promise<PerformanceDistributionDto> {
  const response = await api.get<PerformanceDistributionDto>('/api/v1/assessments/insights', {
    params: { problemId, language },
  });
  return response.data;
}

export async function getCodeReviewQuota(): Promise<CodeReviewQuotaDto> {
  const response = await api.get<CodeReviewQuotaDto>('/api/v1/code-reviews/quota');
  return response.data;
}

export async function getCodeReview(submissionId: string): Promise<SubmissionReviewDto | null> {
  try {
    const response = await api.get<SubmissionReviewDto>(
      `/api/v1/submissions/${submissionId}/review`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function requestCodeReview(submissionId: string): Promise<SubmissionReviewDto> {
  const response = await api.post<SubmissionReviewDto>(
    `/api/v1/submissions/${submissionId}/review`,
  );
  return response.data;
}

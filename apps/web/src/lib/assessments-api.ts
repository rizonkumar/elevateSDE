import type {
  AssessmentDifficulty,
  AssessmentRunRequestDto,
  AssessmentRunResultDto,
  CodingProblemDto,
  ProblemListDto,
  SubmissionAcceptedDto,
  SubmissionDetailDto,
} from '@elevatesde/shared-types';
import { api } from './api';

export interface ListProblemsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  difficulty?: AssessmentDifficulty;
  hasTestCases?: boolean;
}

export async function listProblems(params: ListProblemsParams): Promise<ProblemListDto> {
  const response = await api.get<ProblemListDto>('/api/v1/problems', { params });
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

import { AssessmentDifficulty } from '@prisma/client';
import { LanguageCodeMap, Problem } from '../entities/problem';

export interface ProblemListFilter {
  difficulty?: AssessmentDifficulty;
  tag?: string;
  search?: string;
  hasTestCases?: boolean;
  page: number;
  pageSize: number;
}

export interface ProblemListResult {
  items: Problem[];
  total: number;
}

export interface ProblemTestCaseInput {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ProblemWriteInput {
  title: string;
  difficulty: AssessmentDifficulty;
  description: string;
  constraints: string[];
  tags: string[];
  starterCode: LanguageCodeMap;
  timeLimitMinutes: number;
  isPublished: boolean;
  testCases: ProblemTestCaseInput[];
}

export abstract class IProblemRepository {
  abstract findPublished(filter: ProblemListFilter): Promise<ProblemListResult>;
  abstract findAll(filter: ProblemListFilter): Promise<ProblemListResult>;
  abstract findById(id: string): Promise<Problem | null>;
  abstract create(input: ProblemWriteInput): Promise<Problem>;
  abstract update(id: string, input: ProblemWriteInput): Promise<Problem>;
  abstract setPublished(id: string, isPublished: boolean): Promise<Problem>;
  abstract delete(id: string): Promise<void>;
}

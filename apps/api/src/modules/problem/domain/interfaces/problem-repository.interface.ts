import { AssessmentDifficulty } from '@prisma/client';
import { ProblemProgressStatus } from '@elevatesde/shared-types';
import { LanguageCodeMap, Problem } from '../entities/problem';

export interface ProblemListFilter {
  difficulty?: AssessmentDifficulty;
  topics?: string[];
  company?: string;
  status?: ProblemProgressStatus;
  viewerId?: string;
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

export interface ProblemCompanyInput {
  companyId: string;
  frequency: number;
}

export interface ProblemWriteInput {
  title: string;
  difficulty: AssessmentDifficulty;
  description: string;
  constraints: string[];
  topicIds: string[];
  companies: ProblemCompanyInput[];
  starterCode: Partial<LanguageCodeMap>;
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
  abstract findViewerStatuses(
    viewerId: string,
    problemIds: string[],
  ): Promise<Map<string, ProblemProgressStatus>>;
  abstract countExistingTopics(topicIds: string[]): Promise<number>;
  abstract countExistingCompanies(companyIds: string[]): Promise<number>;
}

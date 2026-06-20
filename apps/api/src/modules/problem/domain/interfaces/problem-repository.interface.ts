import { AssessmentDifficulty } from '@prisma/client';
import { Problem } from '../entities/problem';

export interface ProblemListFilter {
  difficulty?: AssessmentDifficulty;
  tag?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface ProblemListResult {
  items: Problem[];
  total: number;
}

export abstract class IProblemRepository {
  abstract findPublished(filter: ProblemListFilter): Promise<ProblemListResult>;
  abstract findById(id: string): Promise<Problem | null>;
}

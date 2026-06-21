import { AssessmentLanguage as PrismaAssessmentLanguage } from '@prisma/client';
import { ProblemLanguage } from '../../problem/domain/entities/problem';

export const toPrismaLanguage: Record<ProblemLanguage, PrismaAssessmentLanguage> = {
  javascript: PrismaAssessmentLanguage.JAVASCRIPT,
  python: PrismaAssessmentLanguage.PYTHON,
  cpp: PrismaAssessmentLanguage.CPP,
};

export const fromPrismaLanguage: Record<PrismaAssessmentLanguage, ProblemLanguage> = {
  JAVASCRIPT: 'javascript',
  PYTHON: 'python',
  CPP: 'cpp',
};

import { EditorialUnlockReason } from '@prisma/client';
import { LanguageCodeMap } from '../../../problem/domain/entities/problem';

export interface ProblemHintContent {
  ordinal: number;
  content: string;
}

export interface ProblemEditorialContent {
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  isPublished: boolean;
  updatedAt: Date;
}

export type EditorialAvailability = 'UNAVAILABLE' | 'LOCKED' | 'UNLOCKED';

export interface ProblemAssistanceView {
  problemId: string;
  totalHints: number;
  hints: ProblemHintContent[];
  editorial: EditorialAvailability;
  unlockReason: EditorialUnlockReason | null;
  lockedByContest: boolean;
}

export interface ProblemEditorialView {
  problemId: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  solutions: Partial<LanguageCodeMap>;
  unlockReason: EditorialUnlockReason;
  updatedAt: Date;
}

export interface ProblemGuidanceAdminView {
  problemId: string;
  editorial: ProblemEditorialContent | null;
  hints: string[];
}

export interface EditorialWriteInput {
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  isPublished: boolean;
}

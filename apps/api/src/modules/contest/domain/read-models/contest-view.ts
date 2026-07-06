import { AssessmentDifficulty, ContestStatus } from '@prisma/client';

export interface ContestProblemView {
  id: string;
  problemId: string;
  title: string;
  difficulty: AssessmentDifficulty;
  ordinal: number;
  points: number;
}

export interface ContestSummaryView {
  id: string;
  slug: string;
  title: string;
  status: ContestStatus;
  startsAt: Date;
  endsAt: Date;
  problemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContestDetailView extends ContestSummaryView {
  description: string;
  problems: ContestProblemView[];
}

export interface ContestProblemAssignment {
  problemId: string;
  ordinal: number;
  points: number;
}

export interface PublishedProblemRef {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
}

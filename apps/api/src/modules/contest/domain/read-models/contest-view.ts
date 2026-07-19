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

export interface ContestCandidateSummaryView extends ContestSummaryView {
  participantCount: number;
  registered: boolean;
}

export interface ContestCandidateProblemView extends ContestProblemView {
  solved: boolean;
}

export interface ContestCandidateDetailView extends ContestCandidateSummaryView {
  description: string;
  problems: ContestCandidateProblemView[];
}

export interface ContestParticipantView {
  userId: string;
  firstName: string | null;
  lastName: string | null;
}

export interface AcceptedSubmissionView {
  userId: string;
  problemId: string;
  firstAcceptedAt: Date;
}

export interface ContestStandingRowView {
  rank: number;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  solvedCount: number;
  score: number;
  penaltySeconds: number;
  isCurrentUser: boolean;
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

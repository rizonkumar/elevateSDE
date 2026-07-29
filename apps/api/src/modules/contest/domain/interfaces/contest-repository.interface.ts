import { Contest } from '../entities/contest';
import {
  AcceptedSubmissionView,
  ContestDetailView,
  ContestParticipantView,
  ContestProblemAssignment,
  ContestSummaryView,
  PublishedProblemRef,
} from '../read-models/contest-view';

export interface ContestStatusTransitionResult {
  toLive: number;
  toEnded: number;
}

export abstract class IContestRepository {
  abstract list(): Promise<ContestSummaryView[]>;
  abstract applyStatusTransitions(now: Date): Promise<ContestStatusTransitionResult>;
  abstract listVisible(): Promise<ContestSummaryView[]>;
  abstract findDetail(id: string): Promise<ContestDetailView | null>;
  abstract findById(id: string): Promise<Contest | null>;
  abstract findIdBySlug(slug: string): Promise<string | null>;
  abstract findPublishedProblems(problemIds: string[]): Promise<PublishedProblemRef[]>;
  abstract countProblems(contestId: string): Promise<number>;
  abstract create(contest: Contest): Promise<void>;
  abstract update(contest: Contest): Promise<void>;
  abstract setProblems(contestId: string, assignments: ContestProblemAssignment[]): Promise<void>;
  abstract remove(id: string): Promise<void>;
  abstract countParticipants(contestIds: string[]): Promise<Map<string, number>>;
  abstract findRegisteredContestIds(userId: string): Promise<string[]>;
  abstract addParticipant(contestId: string, userId: string): Promise<void>;
  abstract listParticipants(contestId: string): Promise<ContestParticipantView[]>;
  abstract findFirstAcceptedInWindow(
    problemIds: string[],
    userIds: string[],
    from: Date,
    to: Date,
  ): Promise<AcceptedSubmissionView[]>;
}

import { Contest } from '../entities/contest';
import {
  ContestDetailView,
  ContestProblemAssignment,
  ContestSummaryView,
  PublishedProblemRef,
} from '../read-models/contest-view';

export abstract class IContestRepository {
  abstract list(): Promise<ContestSummaryView[]>;
  abstract findDetail(id: string): Promise<ContestDetailView | null>;
  abstract findById(id: string): Promise<Contest | null>;
  abstract findIdBySlug(slug: string): Promise<string | null>;
  abstract findPublishedProblems(problemIds: string[]): Promise<PublishedProblemRef[]>;
  abstract countProblems(contestId: string): Promise<number>;
  abstract create(contest: Contest): Promise<void>;
  abstract update(contest: Contest): Promise<void>;
  abstract setProblems(contestId: string, assignments: ContestProblemAssignment[]): Promise<void>;
  abstract remove(id: string): Promise<void>;
}

import { ContestStatus } from '@prisma/client';
import { IContestRepository } from '../domain/interfaces/contest-repository.interface';
import { Contest } from '../domain/entities/contest';
import {
  AcceptedSubmissionView,
  ContestDetailView,
  ContestFinalResult,
  ContestParticipantView,
  ContestSummaryView,
  PublishedProblemRef,
} from '../domain/read-models/contest-view';

export const CONTEST_STARTS_AT = new Date('2026-07-19T18:00:00.000Z');
export const CONTEST_ENDS_AT = new Date('2026-07-19T19:30:00.000Z');

export const buildContestDetail = (
  overrides: Partial<ContestDetailView> = {},
): ContestDetailView => ({
  id: 'contest-1',
  slug: 'weekly-sprint',
  title: 'Weekly Sprint',
  description: 'desc',
  status: ContestStatus.SCHEDULED,
  startsAt: CONTEST_STARTS_AT,
  endsAt: CONTEST_ENDS_AT,
  problemCount: 2,
  createdAt: CONTEST_STARTS_AT,
  updatedAt: CONTEST_STARTS_AT,
  problems: [
    { id: 'cp-1', problemId: 'p1', title: 'P1', difficulty: 'EASY', ordinal: 0, points: 100 },
    { id: 'cp-2', problemId: 'p2', title: 'P2', difficulty: 'HARD', ordinal: 1, points: 200 },
  ],
  ...overrides,
});

export class FakeContestRepository implements IContestRepository {
  detail: ContestDetailView | null = buildContestDetail();
  participants: ContestParticipantView[] = [];
  accepted: AcceptedSubmissionView[] = [];
  registeredContestIds: string[] = [];
  participantCounts = new Map<string, number>();
  addParticipantCalls: Array<{ contestId: string; userId: string }> = [];
  finalizableContestIds: string[] = [];
  finalizedContests = new Map<string, { results: ContestFinalResult[]; finalizedAt: Date }>();

  async list(): Promise<ContestSummaryView[]> {
    return [];
  }
  async listVisible(): Promise<ContestSummaryView[]> {
    return this.detail ? [this.detail] : [];
  }
  async findDetail(id: string): Promise<ContestDetailView | null> {
    return this.detail?.id === id ? this.detail : null;
  }
  async findById(): Promise<Contest | null> {
    return null;
  }
  async findIdBySlug(slug: string): Promise<string | null> {
    return this.detail?.slug === slug ? this.detail.id : null;
  }
  async findPublishedProblems(): Promise<PublishedProblemRef[]> {
    return [];
  }
  async countProblems(): Promise<number> {
    return this.detail?.problemCount ?? 0;
  }
  async create(): Promise<void> {}
  async update(): Promise<void> {}
  async setProblems(): Promise<void> {}
  async remove(): Promise<void> {}
  async countParticipants(): Promise<Map<string, number>> {
    return this.participantCounts;
  }
  async findRegisteredContestIds(): Promise<string[]> {
    return this.registeredContestIds;
  }
  async addParticipant(contestId: string, userId: string): Promise<void> {
    this.addParticipantCalls.push({ contestId, userId });
  }
  async listParticipants(): Promise<ContestParticipantView[]> {
    return this.participants;
  }
  async findFirstAcceptedInWindow(): Promise<AcceptedSubmissionView[]> {
    return this.accepted;
  }
  async findFinalizableContestIds(): Promise<string[]> {
    return this.finalizableContestIds.filter((id) => !this.finalizedContests.has(id));
  }
  async saveFinalResults(
    contestId: string,
    results: ContestFinalResult[],
    finalizedAt: Date,
  ): Promise<boolean> {
    if (this.finalizedContests.has(contestId)) {
      return false;
    }
    this.finalizedContests.set(contestId, { results, finalizedAt });
    return true;
  }
}

import { ContestStatus } from '@prisma/client';
import { IContestRepository } from '../domain/interfaces/contest-repository.interface';
import { Contest } from '../domain/entities/contest';
import {
  AcceptedSubmissionView,
  ContestDetailView,
  ContestFinalResult,
  ContestLifecycleView,
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
  isRated: true,
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
  finalizableEndedBefore: Date | null = null;
  pendingSubmissions = false;
  liveEntries: Array<{ contestId: string; userId: string; problemId: string }> = [];
  lifecycle: ContestLifecycleView[] = [];
  lifecycleQueries: Array<{ after: Date; upTo: Date }> = [];
  finalizedContests = new Map<string, { results: ContestFinalResult[]; finalizedAt: Date }>();
  contest: Contest | null = null;
  updatedContests: Contest[] = [];
  createdContests: Contest[] = [];

  list(): Promise<ContestSummaryView[]> {
    return Promise.resolve([]);
  }
  listVisible(): Promise<ContestSummaryView[]> {
    return Promise.resolve(this.detail ? [this.detail] : []);
  }
  findDetail(id: string): Promise<ContestDetailView | null> {
    return Promise.resolve(this.detail?.id === id ? this.detail : null);
  }
  findById(id: string): Promise<Contest | null> {
    return Promise.resolve(this.contest?.getId() === id ? this.contest : null);
  }
  findIdBySlug(slug: string): Promise<string | null> {
    return Promise.resolve(this.detail?.slug === slug ? this.detail.id : null);
  }
  findPublishedProblems(): Promise<PublishedProblemRef[]> {
    return Promise.resolve([]);
  }
  countProblems(): Promise<number> {
    return Promise.resolve(this.detail?.problemCount ?? 0);
  }
  create(contest: Contest): Promise<void> {
    this.createdContests.push(contest);
    this.detail = buildContestDetail({ id: contest.getId(), isRated: contest.isRated() });
    return Promise.resolve();
  }
  update(contest: Contest): Promise<void> {
    this.updatedContests.push(contest);
    this.contest = contest;
    return Promise.resolve();
  }
  setProblems(): Promise<void> {
    return Promise.resolve();
  }
  remove(): Promise<void> {
    return Promise.resolve();
  }
  countParticipants(): Promise<Map<string, number>> {
    return Promise.resolve(this.participantCounts);
  }
  findRegisteredContestIds(): Promise<string[]> {
    return Promise.resolve(this.registeredContestIds);
  }
  addParticipant(contestId: string, userId: string): Promise<void> {
    this.addParticipantCalls.push({ contestId, userId });
    return Promise.resolve();
  }
  listParticipants(): Promise<ContestParticipantView[]> {
    return Promise.resolve(this.participants);
  }
  findFirstAcceptedInWindow(): Promise<AcceptedSubmissionView[]> {
    return Promise.resolve(this.accepted);
  }
  findFinalizableContestIds(endedBefore: Date): Promise<string[]> {
    this.finalizableEndedBefore = endedBefore;
    return Promise.resolve(
      this.finalizableContestIds.filter((id) => !this.finalizedContests.has(id)),
    );
  }
  hasPendingSubmissionsInWindow(): Promise<boolean> {
    return Promise.resolve(this.pendingSubmissions);
  }
  findLiveContestIdsForEntry(userId: string, problemId: string): Promise<string[]> {
    return Promise.resolve(
      this.liveEntries
        .filter((entry) => entry.userId === userId && entry.problemId === problemId)
        .map((entry) => entry.contestId),
    );
  }
  findLifecycleChanges(after: Date, upTo: Date): Promise<ContestLifecycleView[]> {
    this.lifecycleQueries.push({ after, upTo });
    return Promise.resolve(this.lifecycle);
  }
  saveFinalResults(
    contestId: string,
    results: ContestFinalResult[],
    finalizedAt: Date,
  ): Promise<boolean> {
    if (this.finalizedContests.has(contestId)) {
      return Promise.resolve(false);
    }
    this.finalizedContests.set(contestId, { results, finalizedAt });
    return Promise.resolve(true);
  }
}

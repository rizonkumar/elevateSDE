import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContestStatus } from '@prisma/client';
import { ContestParticipationService } from './contest-participation.service';
import { IContestRepository } from '../domain/interfaces/contest-repository.interface';
import { Contest } from '../domain/entities/contest';
import {
  AcceptedSubmissionView,
  ContestDetailView,
  ContestParticipantView,
  ContestSummaryView,
  PublishedProblemRef,
} from '../domain/read-models/contest-view';

const STARTS_AT = new Date('2026-07-19T18:00:00.000Z');
const ENDS_AT = new Date('2026-07-19T19:30:00.000Z');

const buildDetail = (overrides: Partial<ContestDetailView> = {}): ContestDetailView => ({
  id: 'contest-1',
  slug: 'weekly-sprint',
  title: 'Weekly Sprint',
  description: 'desc',
  status: ContestStatus.SCHEDULED,
  startsAt: STARTS_AT,
  endsAt: ENDS_AT,
  problemCount: 2,
  createdAt: STARTS_AT,
  updatedAt: STARTS_AT,
  problems: [
    { id: 'cp-1', problemId: 'p1', title: 'P1', difficulty: 'EASY', ordinal: 0, points: 100 },
    { id: 'cp-2', problemId: 'p2', title: 'P2', difficulty: 'HARD', ordinal: 1, points: 200 },
  ],
  ...overrides,
});

class FakeRepository implements IContestRepository {
  detail: ContestDetailView | null = buildDetail();
  participants: ContestParticipantView[] = [];
  accepted: AcceptedSubmissionView[] = [];
  registeredContestIds: string[] = [];
  participantCounts = new Map<string, number>();
  addParticipantCalls: Array<{ contestId: string; userId: string }> = [];

  async list(): Promise<ContestSummaryView[]> {
    return [];
  }

  async applyStatusTransitions(): Promise<{ toLive: number; toEnded: number }> {
    return { toLive: 0, toEnded: 0 };
  }
  async listVisible(): Promise<ContestSummaryView[]> {
    return this.detail ? [this.detail] : [];
  }
  async findDetail(id: string): Promise<ContestDetailView | null> {
    return this.detail && this.detail.id === id ? this.detail : null;
  }
  async findById(): Promise<Contest | null> {
    return null;
  }
  async findIdBySlug(slug: string): Promise<string | null> {
    return this.detail && this.detail.slug === slug ? this.detail.id : null;
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
}

describe('ContestParticipationService', () => {
  let repository: FakeRepository;
  let service: ContestParticipationService;

  beforeEach(() => {
    repository = new FakeRepository();
    service = new ContestParticipationService(repository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const freezeAt = (iso: string) => {
    jest.useFakeTimers({ now: new Date(iso) });
  };

  describe('getBySlugForUser', () => {
    it('throws for a draft contest', async () => {
      repository.detail = buildDetail({ status: ContestStatus.DRAFT });
      await expect(service.getBySlugForUser('weekly-sprint', 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('locks problems before the contest starts', async () => {
      freezeAt('2026-07-19T17:00:00.000Z');
      const detail = await service.getBySlugForUser('weekly-sprint', 'u1');
      expect(detail.status).toBe(ContestStatus.SCHEDULED);
      expect(detail.problems).toEqual([]);
      expect(detail.problemCount).toBe(2);
    });

    it('exposes problems with solved flags while live', async () => {
      freezeAt('2026-07-19T18:30:00.000Z');
      repository.accepted = [
        { userId: 'u1', problemId: 'p2', firstAcceptedAt: new Date('2026-07-19T18:10:00.000Z') },
      ];
      const detail = await service.getBySlugForUser('weekly-sprint', 'u1');
      expect(detail.status).toBe(ContestStatus.LIVE);
      expect(detail.problems.map((problem) => problem.solved)).toEqual([false, true]);
    });
  });

  describe('register', () => {
    it('registers for a scheduled contest', async () => {
      freezeAt('2026-07-19T17:00:00.000Z');
      await service.register('weekly-sprint', 'u1');
      expect(repository.addParticipantCalls).toEqual([{ contestId: 'contest-1', userId: 'u1' }]);
    });

    it('rejects registration after the contest ends', async () => {
      freezeAt('2026-07-19T20:00:00.000Z');
      await expect(service.register('weekly-sprint', 'u1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('standings', () => {
    beforeEach(() => {
      repository.participants = [
        { userId: 'u1', firstName: 'Ada', lastName: 'Lovelace' },
        { userId: 'u2', firstName: 'Alan', lastName: 'Turing' },
        { userId: 'u3', firstName: null, lastName: null },
      ];
    });

    it('returns no rows before the contest starts', async () => {
      freezeAt('2026-07-19T17:00:00.000Z');
      await expect(service.standings('weekly-sprint', 'u1')).resolves.toEqual([]);
    });

    it('ranks by score descending, then penalty ascending', async () => {
      freezeAt('2026-07-19T19:00:00.000Z');
      repository.accepted = [
        { userId: 'u1', problemId: 'p1', firstAcceptedAt: new Date('2026-07-19T18:10:00.000Z') },
        { userId: 'u2', problemId: 'p1', firstAcceptedAt: new Date('2026-07-19T18:40:00.000Z') },
        { userId: 'u2', problemId: 'p2', firstAcceptedAt: new Date('2026-07-19T18:50:00.000Z') },
      ];
      const rows = await service.standings('weekly-sprint', 'u1');
      expect(rows.map((row) => [row.rank, row.userId, row.score, row.solvedCount])).toEqual([
        [1, 'u2', 300, 2],
        [2, 'u1', 100, 1],
        [3, 'u3', 0, 0],
      ]);
      expect(rows[0]?.penaltySeconds).toBe(40 * 60 + 50 * 60);
      expect(rows[1]?.penaltySeconds).toBe(10 * 60);
      expect(rows[1]?.isCurrentUser).toBe(true);
    });

    it('breaks score ties by lower penalty', async () => {
      freezeAt('2026-07-19T19:00:00.000Z');
      repository.accepted = [
        { userId: 'u1', problemId: 'p1', firstAcceptedAt: new Date('2026-07-19T18:45:00.000Z') },
        { userId: 'u2', problemId: 'p1', firstAcceptedAt: new Date('2026-07-19T18:05:00.000Z') },
      ];
      const rows = await service.standings('weekly-sprint', 'u1');
      expect(rows.map((row) => row.userId)).toEqual(['u2', 'u1', 'u3']);
    });
  });
});

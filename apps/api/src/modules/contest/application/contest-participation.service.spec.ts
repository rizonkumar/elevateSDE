import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContestStatus } from '@prisma/client';
import { ContestParticipationService } from './contest-participation.service';
import { ContestStandingsService } from './contest-standings.service';
import { buildContestDetail, FakeContestRepository } from '../testing/fake-contest.repository';

describe('ContestParticipationService', () => {
  let repository: FakeContestRepository;
  let service: ContestParticipationService;

  beforeEach(() => {
    repository = new FakeContestRepository();
    service = new ContestParticipationService(repository, new ContestStandingsService(repository));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const freezeAt = (iso: string) => {
    jest.useFakeTimers({ now: new Date(iso) });
  };

  describe('getBySlugForUser', () => {
    it('throws for a draft contest', async () => {
      repository.detail = buildContestDetail({ status: ContestStatus.DRAFT });
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

    it('assigns shared ranks to exact ties and skips the next rank', async () => {
      freezeAt('2026-07-19T19:00:00.000Z');
      repository.accepted = [
        { userId: 'u1', problemId: 'p1', firstAcceptedAt: new Date('2026-07-19T18:20:00.000Z') },
        { userId: 'u2', problemId: 'p1', firstAcceptedAt: new Date('2026-07-19T18:20:00.000Z') },
      ];
      const rows = await service.standings('weekly-sprint', 'u1');
      expect(rows.map((row) => [row.userId, row.rank])).toEqual([
        ['u1', 1],
        ['u2', 1],
        ['u3', 3],
      ]);
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

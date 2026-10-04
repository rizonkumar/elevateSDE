import { ContestFinalizationService } from './contest-finalization.service';
import { ContestStandingsService } from './contest-standings.service';
import { PointsService } from '../../leaderboard/application/points.service';
import {
  buildContestDetail,
  CONTEST_ENDS_AT,
  FakeContestRepository,
} from '../testing/fake-contest.repository';

const FINALIZED_AT = new Date('2026-07-19T19:35:00.000Z');

describe('ContestFinalizationService', () => {
  let repository: FakeContestRepository;
  let awardContestResults: jest.Mock;
  let service: ContestFinalizationService;

  beforeEach(() => {
    repository = new FakeContestRepository();
    repository.detail = buildContestDetail({ endsAt: CONTEST_ENDS_AT });
    repository.finalizableContestIds = ['contest-1'];
    repository.participants = [
      { userId: 'u1', firstName: 'Ada', lastName: 'Lovelace' },
      { userId: 'u2', firstName: 'Alan', lastName: 'Turing' },
    ];
    repository.accepted = [
      { userId: 'u2', problemId: 'p1', firstAcceptedAt: new Date('2026-07-19T18:10:00.000Z') },
      { userId: 'u2', problemId: 'p2', firstAcceptedAt: new Date('2026-07-19T18:20:00.000Z') },
      { userId: 'u1', problemId: 'p1', firstAcceptedAt: new Date('2026-07-19T18:30:00.000Z') },
    ];
    awardContestResults = jest.fn().mockResolvedValue(2);
    service = new ContestFinalizationService(repository, new ContestStandingsService(repository), {
      awardContestResults,
    } as unknown as PointsService);
  });

  it('persists final ranks and awards contest points', async () => {
    await expect(service.finalizeEnded(FINALIZED_AT)).resolves.toBe(1);

    const expected = [
      { userId: 'u2', rank: 1, score: 300, penaltySeconds: 10 * 60 + 20 * 60 },
      { userId: 'u1', rank: 2, score: 100, penaltySeconds: 30 * 60 },
    ];
    expect(awardContestResults).toHaveBeenCalledWith('contest-1', expected);
    expect(repository.finalizedContests.get('contest-1')).toEqual({
      results: expected,
      finalizedAt: FINALIZED_AT,
    });
  });

  it('awards points before marking the contest finalized', async () => {
    awardContestResults.mockRejectedValue(new Error('database unavailable'));

    await expect(service.finalizeEnded(FINALIZED_AT)).rejects.toThrow('database unavailable');

    expect(repository.finalizedContests.has('contest-1')).toBe(false);
  });

  it('only considers contests that ended before the grace period', async () => {
    await service.finalizeEnded(FINALIZED_AT);

    expect(repository.finalizableEndedBefore).toEqual(new Date('2026-07-19T19:33:00.000Z'));
  });

  it('defers finalization while contest submissions are still being judged', async () => {
    repository.pendingSubmissions = true;

    await expect(service.finalizeEnded(FINALIZED_AT)).resolves.toBe(0);

    expect(awardContestResults).not.toHaveBeenCalled();
    expect(repository.finalizedContests.has('contest-1')).toBe(false);
  });

  it('gives tied participants the same final rank', async () => {
    repository.accepted = [
      { userId: 'u1', problemId: 'p1', firstAcceptedAt: new Date('2026-07-19T18:10:00.000Z') },
      { userId: 'u2', problemId: 'p1', firstAcceptedAt: new Date('2026-07-19T18:10:00.000Z') },
    ];

    await service.finalizeEnded(FINALIZED_AT);

    const results = repository.finalizedContests.get('contest-1')?.results ?? [];
    expect(results.map((result) => result.rank)).toEqual([1, 1]);
  });

  it('is a no-op once a contest is finalized', async () => {
    await service.finalizeEnded(FINALIZED_AT);

    await expect(service.finalizeEnded(FINALIZED_AT)).resolves.toBe(0);
    expect(awardContestResults).toHaveBeenCalledTimes(1);
  });

  it('skips contests that no longer exist', async () => {
    repository.finalizableContestIds = ['missing'];

    await expect(service.finalizeEnded(FINALIZED_AT)).resolves.toBe(0);
    expect(awardContestResults).not.toHaveBeenCalled();
  });
});

import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../../notification/domain/events/notification-events';
import { ContestRatingService } from './contest-rating.service';
import {
  buildPendingContest,
  FakeContestRatingRepository,
} from '../testing/fake-contest-rating.repository';

const RATED_AT = new Date('2026-10-02T00:00:00.000Z');

describe('ContestRatingService', () => {
  let repository: FakeContestRatingRepository;
  let emit: jest.Mock;
  let service: ContestRatingService;

  beforeEach(() => {
    repository = new FakeContestRatingRepository();
    emit = jest.fn();
    service = new ContestRatingService(repository, { emit } as unknown as EventEmitter2);
  });

  it('rates pending contests oldest first so ratings build on each other', async () => {
    repository.addContest(
      buildPendingContest({ id: 'later', endsAt: new Date('2026-10-08T19:30:00.000Z') }),
      [
        { userId: 'u1', rank: 2 },
        { userId: 'u2', rank: 1 },
      ],
    );
    repository.addContest(
      buildPendingContest({ id: 'earlier', endsAt: new Date('2026-10-01T19:30:00.000Z') }),
      [
        { userId: 'u1', rank: 1 },
        { userId: 'u2', rank: 2 },
      ],
    );

    await expect(service.ratePending(RATED_AT)).resolves.toBe(2);

    expect(repository.ratedOrder).toEqual(['earlier', 'later']);
    const later = repository.changes.get('later') ?? [];
    expect(later.find((change) => change.userId === 'u1')?.oldRating).toBe(1597);
    expect(repository.ratings.get('u1')?.contestsRated).toBe(2);
  });

  it('waits for an earlier unfinalized contest before rating later ones', async () => {
    repository.addContest(
      buildPendingContest({ id: 'later', endsAt: new Date('2026-10-08T19:30:00.000Z') }),
      [
        { userId: 'u1', rank: 2 },
        { userId: 'u2', rank: 1 },
      ],
    );
    repository.addContest(
      buildPendingContest({ id: 'oldest', endsAt: new Date('2026-09-24T19:30:00.000Z') }),
      [
        { userId: 'u1', rank: 1 },
        { userId: 'u2', rank: 2 },
      ],
    );
    repository.unfinalizedRatedEndsAt = new Date('2026-10-01T19:30:00.000Z');

    await expect(service.ratePending(RATED_AT)).resolves.toBe(1);
    expect(repository.ratedOrder).toEqual(['oldest']);

    repository.unfinalizedRatedEndsAt = null;
    await expect(service.ratePending(RATED_AT)).resolves.toBe(1);
    expect(repository.ratedOrder).toEqual(['oldest', 'later']);
  });

  it('returns an empty tenant leaderboard for users without an organization', async () => {
    await expect(service.getLeaderboard({ kind: 'tenant', tenantId: null }, 1, 25)).resolves.toEqual(
      { rows: [], total: 0 },
    );
    expect(repository.leaderboardScopes).toEqual([]);
    await service.getLeaderboard({ kind: 'tenant', tenantId: 'tenant-1' }, 1, 25);
    expect(repository.leaderboardScopes).toEqual([{ kind: 'tenant', tenantId: 'tenant-1' }]);
  });

  it('is idempotent once a contest has been rated', async () => {
    repository.addContest(buildPendingContest(), [
      { userId: 'u1', rank: 1 },
      { userId: 'u2', rank: 2 },
    ]);

    await service.ratePending(RATED_AT);
    const ratingsAfterFirstRun = new Map(repository.ratings);

    await expect(service.ratePending(RATED_AT)).resolves.toBe(0);

    expect(repository.ratings).toEqual(ratingsAfterFirstRun);
    expect(repository.ratedOrder).toEqual(['contest-1']);
  });

  it('only rates the candidates the repository considers eligible', async () => {
    repository.addContest(buildPendingContest(), [
      { userId: 'u1', rank: 1 },
      { userId: 'u3', rank: 3 },
    ]);

    await service.ratePending(RATED_AT);

    const rated = (repository.changes.get('contest-1') ?? []).map((change) => change.userId);
    expect(rated).toEqual(['u1', 'u3']);
    expect(repository.ratings.has('u2')).toBe(false);
  });

  it('marks unrated contests as processed without changing ratings', async () => {
    repository.addContest(buildPendingContest({ isRated: false }), [
      { userId: 'u1', rank: 1 },
      { userId: 'u2', rank: 2 },
    ]);

    await expect(service.ratePending(RATED_AT)).resolves.toBe(1);

    expect(repository.ratedAtOf('contest-1')).toEqual(RATED_AT);
    expect(repository.ratings.size).toBe(0);
    expect(emit).not.toHaveBeenCalled();
  });

  it('skips rating when fewer than two participants competed', async () => {
    repository.addContest(buildPendingContest(), [{ userId: 'u1', rank: 1 }]);

    await service.ratePending(RATED_AT);

    expect(repository.ratedAtOf('contest-1')).toEqual(RATED_AT);
    expect(repository.ratings.size).toBe(0);
  });

  it('announces each rating change', async () => {
    repository.addContest(buildPendingContest(), [
      { userId: 'u1', rank: 1 },
      { userId: 'u2', rank: 2 },
    ]);

    await service.ratePending(RATED_AT);

    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenCalledWith(NOTIFICATION_EVENTS.CONTEST_RATING_UPDATED, {
      userId: 'u1',
      contestId: 'contest-1',
      contestSlug: 'weekly-1',
      contestTitle: 'Weekly 1',
      oldRating: 1500,
      newRating: 1597,
      delta: 97,
    });
  });

  it('returns the default rating for users who have never been rated', async () => {
    await expect(service.getSummary('nobody')).resolves.toEqual({
      rating: 1500,
      peakRating: 1500,
      contestsRated: 0,
      history: [],
    });
    await expect(service.findRatedSummary('nobody')).resolves.toBeNull();
  });
});

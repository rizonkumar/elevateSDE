import { BadRequestException } from '@nestjs/common';
import { Contest } from '../domain/entities/contest';
import { ContestService, SaveContestInput } from './contest.service';
import {
  buildContestDetail,
  CONTEST_ENDS_AT,
  CONTEST_STARTS_AT,
  FakeContestRepository,
} from '../testing/fake-contest.repository';

const BEFORE_END = new Date('2026-07-19T19:00:00.000Z');
const AFTER_END = new Date('2026-07-19T20:00:00.000Z');

describe('ContestService rating toggle', () => {
  let repository: FakeContestRepository;
  let service: ContestService;
  let contest: Contest;

  const input = (overrides: Partial<SaveContestInput> = {}): SaveContestInput => ({
    slug: 'weekly-sprint',
    title: 'Weekly Sprint',
    description: 'desc',
    startsAt: CONTEST_STARTS_AT,
    endsAt: CONTEST_ENDS_AT,
    ...overrides,
  });

  beforeEach(() => {
    repository = new FakeContestRepository();
    contest = Contest.create({
      slug: 'weekly-sprint',
      title: 'Weekly Sprint',
      description: 'desc',
      startsAt: CONTEST_STARTS_AT,
      endsAt: CONTEST_ENDS_AT,
      tenantId: null,
      isRated: true,
    });
    repository.contest = contest;
    repository.detail = buildContestDetail({ id: contest.getId() });
    service = new ContestService(repository);
  });

  it('allows turning rating off before the contest ends', async () => {
    await service.update(contest.getId(), input({ isRated: false }), BEFORE_END);

    expect(repository.updatedContests[0]?.isRated()).toBe(false);
  });

  it('rejects changing the rating flag after the contest has ended', async () => {
    await expect(
      service.update(contest.getId(), input({ isRated: false }), AFTER_END),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.updatedContests).toHaveLength(0);
  });

  it('still allows other edits after the contest has ended when the flag is unchanged', async () => {
    await service.update(contest.getId(), input({ title: 'Renamed', isRated: true }), AFTER_END);
    await service.update(contest.getId(), input({ title: 'Renamed again' }), AFTER_END);

    expect(repository.updatedContests.map((entry) => entry.getTitle())).toEqual([
      'Renamed',
      'Renamed again',
    ]);
    expect(repository.updatedContests.every((entry) => entry.isRated())).toBe(true);
  });

  it('creates rated contests by default', async () => {
    await service.create(input({ slug: 'fresh' }));

    expect(repository.createdContests[0]?.isRated()).toBe(true);
  });
});

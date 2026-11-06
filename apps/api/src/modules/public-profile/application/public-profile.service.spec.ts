import { NotFoundException } from '@nestjs/common';
import { ProfileVisibility } from '@prisma/client';
import {
  FakeHeatmapSource,
  FakePublicProfileRepository,
  profileUser,
} from '../testing/fake-public-profile.repository';
import { PublicProfilePresentationMapper } from '../presentation/mappers/public-profile-presentation.mapper';
import { PublicProfileService } from './public-profile.service';

const NOW = new Date('2026-11-06T12:00:00.000Z');

describe('PublicProfileService', () => {
  let repository: FakePublicProfileRepository;
  let heatmap: FakeHeatmapSource;
  let service: PublicProfileService;

  beforeEach(() => {
    repository = new FakePublicProfileRepository();
    heatmap = new FakeHeatmapSource();
    service = new PublicProfileService(repository, heatmap);
  });

  function addPublicUser(overrides: Parameters<typeof profileUser>[1] = {}) {
    const user = profileUser('user-1', {
      handle: 'ada',
      profileVisibility: ProfileVisibility.PUBLIC,
      bio: 'Systems person.',
      githubUrl: 'https://github.com/ada',
      ...overrides,
    });
    repository.users.push(user);
    return user;
  }

  it('assembles the public profile from every source', async () => {
    addPublicUser({
      showOrganization: true,
      organization: { name: 'Acme', allowPublicProfiles: true },
    });
    const view = await service.getByHandle('Ada', NOW);
    expect(view).toMatchObject({
      handle: 'ada',
      displayName: 'Ada Lovelace',
      headline: 'Backend engineer',
      bio: 'Systems person.',
      links: { github: 'https://github.com/ada', linkedin: null, website: null },
      organizationName: 'Acme',
      points: 1280,
      streak: { current: 4, longest: 21 },
      rating: null,
    });
    expect(view.solved.byDifficulty.MEDIUM).toEqual({ solved: 18, total: 180 });
    expect(view.topTopics).toHaveLength(1);
    expect(view.badges).toHaveLength(1);
    expect(view.recentSolves).toHaveLength(1);
    expect(view.heatmap).toEqual([{ date: '2026-03-01', count: 3 }]);
    expect(repository.topicLimits).toEqual([8]);
    expect(repository.recentLimits).toEqual([10]);
    const call = heatmap.calls[0];
    expect(call?.userId).toBe('user-1');
    expect(call?.to).toEqual(NOW);
    expect(NOW.getTime() - (call?.from.getTime() ?? 0)).toBe(365 * 86_400_000);
  });

  it('hides the organization unless the owner opts in', async () => {
    addPublicUser({ organization: { name: 'Acme', allowPublicProfiles: true } });
    const view = await service.getByHandle('ada', NOW);
    expect(view.organizationName).toBeNull();
  });

  it('falls back to the handle when the owner has no name', async () => {
    const user = addPublicUser();
    user.firstName = null;
    user.lastName = '  ';
    const view = await service.getByHandle('ada', NOW);
    expect(view.displayName).toBe('ada');
  });

  it.each([
    ['a missing handle', 'nobody'],
    ['an invalid handle', '--'],
  ])('returns 404 for %s', async (_label, handle) => {
    addPublicUser();
    await expect(service.getByHandle(handle, NOW)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for a private profile', async () => {
    addPublicUser({ profileVisibility: ProfileVisibility.PRIVATE });
    await expect(service.getByHandle('ada', NOW)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when the organization disallows public profiles', async () => {
    addPublicUser({ organization: { name: 'Acme', allowPublicProfiles: false } });
    await expect(service.getByHandle('ada', NOW)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for inactive accounts', async () => {
    const user = addPublicUser();
    user.isActive = false;
    await expect(service.getByHandle('ada', NOW)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uses the same 404 message for missing and private profiles', async () => {
    addPublicUser({ profileVisibility: ProfileVisibility.PRIVATE });
    const privateError = await service.getByHandle('ada', NOW).catch((error: Error) => error);
    const missingError = await service.getByHandle('nobody', NOW).catch((error: Error) => error);
    expect(privateError).toBeInstanceOf(NotFoundException);
    expect(missingError).toBeInstanceOf(NotFoundException);
    expect((privateError as NotFoundException).message).toBe(
      (missingError as NotFoundException).message,
    );
  });

  it('never exposes private fields in the response DTO', async () => {
    addPublicUser({ organization: { name: 'Acme', allowPublicProfiles: true } });
    const dto = PublicProfilePresentationMapper.toProfile(await service.getByHandle('ada', NOW));
    expect(Object.keys(dto).sort()).toEqual(
      [
        'badges',
        'bio',
        'displayName',
        'handle',
        'headline',
        'heatmap',
        'joinedAt',
        'links',
        'location',
        'organizationName',
        'points',
        'rating',
        'recentSolves',
        'solved',
        'streak',
        'topTopics',
      ].sort(),
    );
    const serialized = JSON.stringify(dto);
    for (const forbidden of ['email', 'userId', 'tenantId', 'passwordHash', 'googleId', 'role']) {
      expect(serialized).not.toContain(`"${forbidden}"`);
    }
    expect(serialized).not.toContain('user-1');
  });
});

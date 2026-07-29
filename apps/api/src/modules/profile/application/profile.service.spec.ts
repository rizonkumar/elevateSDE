import { NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { IProfileRepository } from '../domain/interfaces/profile-repository.interface';
import { PublicProfileView } from '../domain/read-models/public-profile-view';

function buildProfile(overrides: Partial<PublicProfileView> = {}): PublicProfileView {
  return {
    handle: 'ada-lovelace',
    firstName: 'Ada',
    lastName: 'Lovelace',
    headline: null,
    bio: null,
    githubUrl: null,
    linkedinUrl: null,
    websiteUrl: null,
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    stats: {
      points: 0,
      rank: null,
      streakDays: 0,
      longestStreak: 0,
      problemsSolved: 0,
      acceptanceRate: 0,
      byDifficulty: { EASY: 0, MEDIUM: 0, HARD: 0 },
    },
    badges: [],
    heatmap: [],
    publicLists: [],
    ...overrides,
  };
}

describe('ProfileService.getPublicProfile', () => {
  it('returns the profile when found', async () => {
    const profile = buildProfile();
    const repository = {
      findPublicProfile: jest.fn().mockResolvedValue(profile),
    } as unknown as IProfileRepository;
    const service = new ProfileService(repository);

    await expect(service.getPublicProfile('ada-lovelace')).resolves.toBe(profile);
  });

  it('throws not found for a missing or private profile', async () => {
    const repository = {
      findPublicProfile: jest.fn().mockResolvedValue(null),
    } as unknown as IProfileRepository;
    const service = new ProfileService(repository);

    await expect(service.getPublicProfile('unknown')).rejects.toBeInstanceOf(NotFoundException);
  });
});

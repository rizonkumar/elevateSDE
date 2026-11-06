import { ProfileVisibility } from '@prisma/client';
import { HandleTakenError } from '../domain/errors/handle-taken.error';
import { IPublicProfileRepository } from '../domain/interfaces/public-profile-repository.interface';
import { IProfileHeatmapSource } from '../domain/interfaces/profile-heatmap-source.interface';
import {
  EarnedBadge,
  HeatmapCell,
  PublicProfileActivity,
  PublicProfileOwner,
  PublicProfileSettingsRecord,
  PublicProfileSettingsWrite,
  RecentSolve,
  SolvedBreakdown,
  TopicSolvedCount,
} from '../domain/read-models/public-profile';

export interface FakeProfileUser {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  isActive: boolean;
  joinedAt: Date;
  settings: PublicProfileSettingsRecord;
}

export function privateSettings(
  overrides: Partial<PublicProfileSettingsRecord> = {},
): PublicProfileSettingsRecord {
  return {
    handle: null,
    bio: null,
    location: null,
    githubUrl: null,
    linkedinUrl: null,
    websiteUrl: null,
    profileVisibility: ProfileVisibility.PRIVATE,
    showOrganization: false,
    organization: null,
    ...overrides,
  };
}

export function profileUser(
  userId: string,
  overrides: Partial<PublicProfileSettingsRecord> = {},
): FakeProfileUser {
  return {
    userId,
    firstName: 'Ada',
    lastName: 'Lovelace',
    headline: 'Backend engineer',
    isActive: true,
    joinedAt: new Date('2026-01-04T10:00:00.000Z'),
    settings: privateSettings(overrides),
  };
}

export class FakePublicProfileRepository implements IPublicProfileRepository {
  users: FakeProfileUser[] = [];
  saved: Array<{ userId: string; settings: PublicProfileSettingsWrite }> = [];
  raceHandle: string | null = null;
  activity: PublicProfileActivity = { points: 1280, currentStreak: 4, longestStreak: 21 };
  solved: SolvedBreakdown = {
    solved: 42,
    total: 380,
    byDifficulty: {
      EASY: { solved: 20, total: 140 },
      MEDIUM: { solved: 18, total: 180 },
      HARD: { solved: 4, total: 60 },
    },
  };
  topics: TopicSolvedCount[] = [{ slug: 'arrays', name: 'Arrays', solved: 12 }];
  badges: EarnedBadge[] = [
    {
      key: 'first-blood',
      name: 'First Blood',
      description: 'Solve your first problem.',
      icon: 'Trophy',
      awardedAt: new Date('2026-02-01T00:00:00.000Z'),
    },
  ];
  recent: RecentSolve[] = [
    {
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'EASY',
      solvedAt: new Date('2026-03-01T00:00:00.000Z'),
    },
  ];
  topicLimits: number[] = [];
  recentLimits: number[] = [];

  async findOwnerByHandle(handle: string): Promise<PublicProfileOwner | null> {
    const user = this.users.find((candidate) => candidate.settings.handle === handle);
    if (!user || user.settings.handle === null) {
      return null;
    }
    return {
      ...user.settings,
      handle: user.settings.handle,
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      headline: user.headline,
      isActive: user.isActive,
      joinedAt: user.joinedAt,
    };
  }

  async getActivity(): Promise<PublicProfileActivity> {
    return this.activity;
  }

  async getSolvedBreakdown(): Promise<SolvedBreakdown> {
    return this.solved;
  }

  async listTopTopics(_userId: string, limit: number): Promise<TopicSolvedCount[]> {
    this.topicLimits.push(limit);
    return this.topics;
  }

  async listBadges(): Promise<EarnedBadge[]> {
    return this.badges;
  }

  async listRecentSolves(_userId: string, limit: number): Promise<RecentSolve[]> {
    this.recentLimits.push(limit);
    return this.recent;
  }

  async findSettings(userId: string): Promise<PublicProfileSettingsRecord | null> {
    return this.users.find((user) => user.userId === userId)?.settings ?? null;
  }

  async findUserIdByHandle(handle: string): Promise<string | null> {
    return this.users.find((user) => user.settings.handle === handle)?.userId ?? null;
  }

  async saveSettings(userId: string, settings: PublicProfileSettingsWrite): Promise<void> {
    if (settings.handle !== null && settings.handle === this.raceHandle) {
      throw new HandleTakenError(settings.handle);
    }
    this.saved.push({ userId, settings });
    const user = this.users.find((candidate) => candidate.userId === userId);
    if (user) {
      user.settings = { ...settings, organization: user.settings.organization };
    }
  }
}

export class FakeHeatmapSource implements IProfileHeatmapSource {
  calls: Array<{ userId: string; from: Date; to: Date }> = [];
  cells: HeatmapCell[] = [{ date: '2026-03-01', count: 3 }];

  async getHeatmap(userId: string, from: Date, to: Date): Promise<HeatmapCell[]> {
    this.calls.push({ userId, from, to });
    return this.cells;
  }
}

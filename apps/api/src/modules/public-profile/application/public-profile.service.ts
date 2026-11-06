import { Injectable, NotFoundException } from '@nestjs/common';
import { buildDisplayName } from '../../../common/display-name';
import { isProfilePublic } from '../../../common/public-handle';
import { IPublicProfileRepository } from '../domain/interfaces/public-profile-repository.interface';
import { IProfileHeatmapSource } from '../domain/interfaces/profile-heatmap-source.interface';
import { handleFormatProblem, normalizeHandle } from '../domain/policies/handle-policy';
import {
  HEATMAP_WINDOW_DAYS,
  RECENT_SOLVES_LIMIT,
  TOP_TOPICS_LIMIT,
} from '../domain/policies/profile-text-limits';
import { PublicProfileOwner, PublicProfileView } from '../domain/read-models/public-profile';

const DAY_MS = 86_400_000;
const PROFILE_NOT_FOUND = 'Profile not found.';

@Injectable()
export class PublicProfileService {
  constructor(
    private readonly repository: IPublicProfileRepository,
    private readonly heatmapSource: IProfileHeatmapSource,
  ) {}

  async getByHandle(rawHandle: string, now: Date = new Date()): Promise<PublicProfileView> {
    const owner = await this.findVisibleOwner(rawHandle);
    const from = new Date(now.getTime() - HEATMAP_WINDOW_DAYS * DAY_MS);
    const [activity, solved, topTopics, badges, recentSolves, heatmap] = await Promise.all([
      this.repository.getActivity(owner.userId),
      this.repository.getSolvedBreakdown(owner.userId),
      this.repository.listTopTopics(owner.userId, TOP_TOPICS_LIMIT),
      this.repository.listBadges(owner.userId),
      this.repository.listRecentSolves(owner.userId, RECENT_SOLVES_LIMIT),
      this.heatmapSource.getHeatmap(owner.userId, from, now),
    ]);
    return {
      handle: owner.handle,
      displayName: displayNameFor(owner),
      headline: owner.headline,
      bio: owner.bio,
      location: owner.location,
      links: {
        github: owner.githubUrl,
        linkedin: owner.linkedinUrl,
        website: owner.websiteUrl,
      },
      organizationName: owner.showOrganization ? (owner.organization?.name ?? null) : null,
      joinedAt: owner.joinedAt,
      points: activity.points,
      streak: { current: activity.currentStreak, longest: activity.longestStreak },
      solved,
      topTopics,
      badges,
      heatmap,
      recentSolves,
      rating: null,
    };
  }

  private async findVisibleOwner(rawHandle: string): Promise<PublicProfileOwner> {
    const handle = normalizeHandle(rawHandle);
    if (handleFormatProblem(handle) === 'INVALID') {
      throw new NotFoundException(PROFILE_NOT_FOUND);
    }
    const owner = await this.repository.findOwnerByHandle(handle);
    if (
      !owner ||
      !owner.isActive ||
      !isProfilePublic({
        handle: owner.handle,
        profileVisibility: owner.profileVisibility,
        tenant: owner.organization,
      })
    ) {
      throw new NotFoundException(PROFILE_NOT_FOUND);
    }
    return owner;
  }
}

function displayNameFor(owner: PublicProfileOwner): string {
  const hasName = [owner.firstName, owner.lastName].some(
    (part) => part !== null && part.trim().length > 0,
  );
  return hasName ? buildDisplayName(owner.firstName, owner.lastName) : owner.handle;
}

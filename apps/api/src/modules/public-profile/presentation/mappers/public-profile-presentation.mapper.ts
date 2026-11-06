import { PublicProfileDto, PublicProfileSettingsDto } from '@elevatesde/shared-types';
import { HandleAvailabilityView } from '../../application/public-profile-settings.service';
import {
  PublicProfileSettingsView,
  PublicProfileView,
} from '../../domain/read-models/public-profile';
import { HandleAvailabilityResponseDto } from '../dtos/public-profile-settings-response.dto';

export class PublicProfilePresentationMapper {
  static toProfile(view: PublicProfileView): PublicProfileDto {
    return {
      handle: view.handle,
      displayName: view.displayName,
      headline: view.headline,
      bio: view.bio,
      location: view.location,
      links: { ...view.links },
      organizationName: view.organizationName,
      joinedAt: view.joinedAt.toISOString(),
      points: view.points,
      streak: { ...view.streak },
      solved: {
        solved: view.solved.solved,
        total: view.solved.total,
        byDifficulty: {
          EASY: { ...view.solved.byDifficulty.EASY },
          MEDIUM: { ...view.solved.byDifficulty.MEDIUM },
          HARD: { ...view.solved.byDifficulty.HARD },
        },
      },
      topTopics: view.topTopics.map((topic) => ({ ...topic })),
      badges: view.badges.map((badge) => ({
        key: badge.key,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        awardedAt: badge.awardedAt.toISOString(),
      })),
      heatmap: view.heatmap.map((cell) => ({ date: cell.date, count: cell.count })),
      recentSolves: view.recentSolves.map((solve) => ({
        slug: solve.slug,
        title: solve.title,
        difficulty: solve.difficulty,
        solvedAt: solve.solvedAt.toISOString(),
      })),
      rating: view.rating ? { ...view.rating } : null,
    };
  }

  static toSettings(view: PublicProfileSettingsView): PublicProfileSettingsDto {
    return {
      handle: view.handle,
      bio: view.bio,
      location: view.location,
      githubUrl: view.githubUrl,
      linkedinUrl: view.linkedinUrl,
      websiteUrl: view.websiteUrl,
      profileVisibility: view.profileVisibility,
      showOrganization: view.showOrganization,
      organizationName: view.organization?.name ?? null,
      organizationAllowsPublicProfiles: view.organization?.allowPublicProfiles ?? true,
      isPublic: view.isPublic,
    };
  }

  static toAvailability(view: HandleAvailabilityView): HandleAvailabilityResponseDto {
    const dto = new HandleAvailabilityResponseDto();
    dto.handle = view.handle;
    dto.available = view.available;
    dto.reason = view.reason;
    return dto;
  }
}

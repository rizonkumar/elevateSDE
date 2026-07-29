import { PublicProfileView } from '../../domain/read-models/public-profile-view';
import {
  PublicBadgeResponseDto,
  PublicHeatmapCellResponseDto,
  PublicListSummaryResponseDto,
  PublicProfileResponseDto,
  PublicProfileStatsResponseDto,
} from '../dtos/public-profile-response.dto';

export class ProfilePresentationMapper {
  static toResponse(view: PublicProfileView): PublicProfileResponseDto {
    const dto = new PublicProfileResponseDto();
    dto.handle = view.handle;
    dto.firstName = view.firstName;
    dto.lastName = view.lastName;
    dto.headline = view.headline;
    dto.bio = view.bio;
    dto.githubUrl = view.githubUrl;
    dto.linkedinUrl = view.linkedinUrl;
    dto.websiteUrl = view.websiteUrl;
    dto.joinedAt = view.joinedAt.toISOString();
    dto.stats = this.toStats(view.stats);
    dto.badges = view.badges.map((badge) => this.toBadge(badge));
    dto.heatmap = view.heatmap.map((cell) => this.toHeatmapCell(cell));
    dto.publicLists = view.publicLists.map((list) => this.toListSummary(list));
    return dto;
  }

  private static toStats(stats: PublicProfileView['stats']): PublicProfileStatsResponseDto {
    const dto = new PublicProfileStatsResponseDto();
    dto.points = stats.points;
    dto.rank = stats.rank;
    dto.streakDays = stats.streakDays;
    dto.longestStreak = stats.longestStreak;
    dto.problemsSolved = stats.problemsSolved;
    dto.acceptanceRate = stats.acceptanceRate;
    dto.byDifficulty = stats.byDifficulty;
    return dto;
  }

  private static toBadge(badge: PublicProfileView['badges'][number]): PublicBadgeResponseDto {
    const dto = new PublicBadgeResponseDto();
    dto.id = badge.id;
    dto.key = badge.key;
    dto.name = badge.name;
    dto.description = badge.description;
    dto.icon = badge.icon;
    dto.criteriaType = badge.criteriaType;
    dto.threshold = badge.threshold;
    dto.isActive = badge.isActive;
    dto.awardedAt = badge.awardedAt.toISOString();
    return dto;
  }

  private static toHeatmapCell(
    cell: PublicProfileView['heatmap'][number],
  ): PublicHeatmapCellResponseDto {
    const dto = new PublicHeatmapCellResponseDto();
    dto.date = cell.date;
    dto.count = cell.count;
    return dto;
  }

  private static toListSummary(
    list: PublicProfileView['publicLists'][number],
  ): PublicListSummaryResponseDto {
    const dto = new PublicListSummaryResponseDto();
    dto.id = list.id;
    dto.name = list.name;
    dto.itemCount = list.itemCount;
    dto.createdAt = list.createdAt.toISOString();
    return dto;
  }
}

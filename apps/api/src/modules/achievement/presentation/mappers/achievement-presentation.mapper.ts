import { Badge } from '../../domain/entities/badge';
import {
  AchievementsView,
  AdminBadgeView,
  EarnedBadgeView,
  LockedBadgeView,
} from '../../domain/read-models/achievement-view';
import { AchievementsViewResponseDto } from '../dtos/achievements-view-response.dto';
import { AdminBadgeResponseDto } from '../dtos/admin-badge-response.dto';
import { BadgeResponseDto } from '../dtos/badge-response.dto';
import { LockedBadgeResponseDto } from '../dtos/locked-badge-response.dto';
import { UserBadgeResponseDto } from '../dtos/user-badge-response.dto';

export class AchievementPresentationMapper {
  static toUserBadge(view: EarnedBadgeView): UserBadgeResponseDto {
    const dto = new UserBadgeResponseDto();
    assignBadge(dto, view.badge);
    dto.awardedAt = view.awardedAt.toISOString();
    return dto;
  }

  static toLockedBadge(view: LockedBadgeView): LockedBadgeResponseDto {
    const dto = new LockedBadgeResponseDto();
    assignBadge(dto, view.badge);
    dto.progress = view.progress;
    return dto;
  }

  static toAdminBadge(view: AdminBadgeView): AdminBadgeResponseDto {
    const dto = new AdminBadgeResponseDto();
    assignBadge(dto, view.badge);
    dto.awardCount = view.awardCount;
    return dto;
  }

  static toAchievements(view: AchievementsView): AchievementsViewResponseDto {
    const dto = new AchievementsViewResponseDto();
    dto.earned = view.earned.map((entry) => this.toUserBadge(entry));
    dto.locked = view.locked.map((entry) => this.toLockedBadge(entry));
    return dto;
  }
}

function assignBadge(dto: BadgeResponseDto, badge: Badge): void {
  dto.id = badge.getId();
  dto.key = badge.getKey();
  dto.name = badge.getName();
  dto.description = badge.getDescription();
  dto.icon = badge.getIcon();
  dto.criteriaType = badge.getCriteriaType();
  dto.threshold = badge.getThreshold();
  dto.isActive = badge.isActiveBadge();
}

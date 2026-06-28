import { Badge as PrismaBadge } from '@prisma/client';
import { Badge } from '../../domain/entities/badge';

export class BadgeMapper {
  static toDomain(record: PrismaBadge): Badge {
    return Badge.reconstitute({
      id: record.id,
      key: record.key,
      name: record.name,
      description: record.description,
      icon: record.icon,
      criteriaType: record.criteriaType,
      threshold: record.threshold,
      tenantId: record.tenantId,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(
    badge: Badge,
  ): Pick<
    PrismaBadge,
    'id' | 'key' | 'name' | 'description' | 'icon' | 'criteriaType' | 'threshold' | 'tenantId' | 'isActive'
  > {
    return {
      id: badge.getId(),
      key: badge.getKey(),
      name: badge.getName(),
      description: badge.getDescription(),
      icon: badge.getIcon(),
      criteriaType: badge.getCriteriaType(),
      threshold: badge.getThreshold(),
      tenantId: badge.getTenantId(),
      isActive: badge.isActiveBadge(),
    };
  }
}

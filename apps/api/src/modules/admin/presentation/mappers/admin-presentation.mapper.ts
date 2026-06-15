import { AuditLog } from '../../../audit-log/domain/entities/audit-log';
import { AuditLogResponseDto } from '../dtos/audit-log-response.dto';
import { FeatureFlag } from '../../../feature-flag/domain/entities/feature-flag';
import { FeatureFlagResponseDto } from '../dtos/feature-flag-response.dto';
import { TenantResponseDto } from '../dtos/tenant-response.dto';
import { Tenant as PrismaTenant } from '@prisma/client';

export class AdminPresentationMapper {
  static toAuditLogResponse(entity: AuditLog): AuditLogResponseDto {
    const dto = new AuditLogResponseDto();
    dto.id = entity.getId();
    dto.userId = entity.getUserId();
    dto.action = entity.getAction();
    dto.metadata = entity.getMetadata();
    dto.createdAt = entity.getCreatedAt().toISOString();
    return dto;
  }

  static toFeatureFlagResponse(entity: FeatureFlag): FeatureFlagResponseDto {
    const dto = new FeatureFlagResponseDto();
    dto.id = entity.getId();
    dto.flagKey = entity.getFlagKey();
    dto.isEnabled = entity.getIsEnabled();
    dto.percentageRollout = entity.getPercentageRollout();
    dto.createdAt = entity.getCreatedAt().toISOString();
    dto.updatedAt = entity.getUpdatedAt().toISOString();
    return dto;
  }

  static toTenantResponse(model: PrismaTenant): TenantResponseDto {
    const dto = new TenantResponseDto();
    dto.id = model.id;
    dto.name = model.name;
    dto.stripeCustomerId = model.stripeCustomerId;
    dto.subscriptionPlan = model.subscriptionPlan;
    dto.createdAt = model.createdAt.toISOString();
    dto.updatedAt = model.updatedAt.toISOString();
    return dto;
  }
}

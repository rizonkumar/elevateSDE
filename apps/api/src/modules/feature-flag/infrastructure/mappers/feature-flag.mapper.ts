import { FeatureFlag } from '../../domain/entities/feature-flag';
import { FeatureFlag as PrismaFeatureFlag } from '@prisma/client';

export class FeatureFlagMapper {
  static toDomain(prismaFeatureFlag: PrismaFeatureFlag): FeatureFlag {
    return FeatureFlag.reconstitute(
      prismaFeatureFlag.id,
      prismaFeatureFlag.flagKey,
      prismaFeatureFlag.isEnabled,
      prismaFeatureFlag.percentageRollout,
      prismaFeatureFlag.createdAt,
      prismaFeatureFlag.updatedAt,
    );
  }

  static toPersistence(
    featureFlag: FeatureFlag,
  ): Omit<PrismaFeatureFlag, 'createdAt' | 'updatedAt'> {
    return {
      id: featureFlag.getId(),
      flagKey: featureFlag.getFlagKey(),
      isEnabled: featureFlag.getIsEnabled(),
      percentageRollout: featureFlag.getPercentageRollout(),
    };
  }
}

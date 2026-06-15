import { Injectable } from '@nestjs/common';
import { IFeatureFlagRepository } from '../../domain/interfaces/feature-flag-repository.interface';
import { FeatureFlag } from '../../domain/entities/feature-flag';
import { FeatureFlagMapper } from '../mappers/feature-flag.mapper';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class FeatureFlagRepository implements IFeatureFlagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<FeatureFlag | null> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { id },
    });
    if (!flag) {
      return null;
    }
    return FeatureFlagMapper.toDomain(flag);
  }

  async findByKey(flagKey: string): Promise<FeatureFlag | null> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { flagKey },
    });
    if (!flag) {
      return null;
    }
    return FeatureFlagMapper.toDomain(flag);
  }

  async save(featureFlag: FeatureFlag): Promise<FeatureFlag> {
    const data = FeatureFlagMapper.toPersistence(featureFlag);
    const flag = await this.prisma.featureFlag.upsert({
      where: { id: featureFlag.getId() },
      update: {
        flagKey: data.flagKey,
        isEnabled: data.isEnabled,
        percentageRollout: data.percentageRollout,
      },
      create: {
        id: data.id,
        flagKey: data.flagKey,
        isEnabled: data.isEnabled,
        percentageRollout: data.percentageRollout,
      },
    });
    return FeatureFlagMapper.toDomain(flag);
  }

  async findAll(): Promise<FeatureFlag[]> {
    const flags = await this.prisma.featureFlag.findMany({
      orderBy: { flagKey: 'asc' },
    });
    return flags.map((flag) => FeatureFlagMapper.toDomain(flag));
  }
}

import { Module } from '@nestjs/common';
import { IFeatureFlagRepository } from './domain/interfaces/feature-flag-repository.interface';
import { FeatureFlagRepository } from './infrastructure/repositories/feature-flag.repository';
import { FeatureFlagService } from './application/feature-flag.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  providers: [
    FeatureFlagService,
    PrismaService,
    {
      provide: IFeatureFlagRepository,
      useClass: FeatureFlagRepository,
    },
  ],
  exports: [FeatureFlagService],
})
export class FeatureFlagModule {}

import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { DashboardModule } from '../dashboard/dashboard.module';
import { PublicProfileService } from './application/public-profile.service';
import { PublicProfileSettingsService } from './application/public-profile-settings.service';
import { IPublicProfileRepository } from './domain/interfaces/public-profile-repository.interface';
import { IProfileHeatmapSource } from './domain/interfaces/profile-heatmap-source.interface';
import { DashboardHeatmapSource } from './infrastructure/adapters/dashboard-heatmap.source';
import { PublicProfileRepository } from './infrastructure/repositories/public-profile.repository';
import { PublicProfilesController } from './presentation/controllers/public-profiles.controller';
import { PublicProfileSettingsController } from './presentation/controllers/public-profile-settings.controller';

@Module({
  imports: [DashboardModule],
  controllers: [PublicProfilesController, PublicProfileSettingsController],
  providers: [
    PublicProfileService,
    PublicProfileSettingsService,
    PrismaService,
    { provide: IPublicProfileRepository, useClass: PublicProfileRepository },
    { provide: IProfileHeatmapSource, useClass: DashboardHeatmapSource },
  ],
  exports: [PublicProfileService],
})
export class PublicProfileModule {}

import { Module } from '@nestjs/common';
import { IDashboardRepository } from './domain/interfaces/dashboard-repository.interface';
import { DashboardRepository } from './infrastructure/repositories/dashboard.repository';
import { DashboardService } from './application/dashboard.service';
import { DashboardController } from './presentation/controllers/dashboard.controller';
import { SubmissionHeatmapController } from './presentation/controllers/submission-heatmap.controller';
import { SolvedProblemsController } from './presentation/controllers/solved-problems.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [DashboardController, SubmissionHeatmapController, SolvedProblemsController],
  providers: [
    DashboardService,
    PrismaService,
    {
      provide: IDashboardRepository,
      useClass: DashboardRepository,
    },
  ],
  exports: [DashboardService],
})
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { AchievementModule } from '../achievement/achievement.module';
import { IScoringRepository } from './domain/interfaces/scoring-repository.interface';
import { ScoringRepository } from './infrastructure/repositories/scoring.repository';
import { ScoringService } from './application/scoring.service';
import { ScoringManagementController } from './presentation/controllers/scoring-management.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  imports: [AchievementModule],
  controllers: [ScoringManagementController],
  providers: [
    ScoringService,
    PrismaService,
    {
      provide: IScoringRepository,
      useClass: ScoringRepository,
    },
  ],
  exports: [ScoringService],
})
export class ScoringModule {}

import { Module } from '@nestjs/common';
import { IAchievementRepository } from './domain/interfaces/achievement-repository.interface';
import { AchievementRepository } from './infrastructure/repositories/achievement.repository';
import { AchievementService } from './application/achievement.service';
import { AchievementController } from './presentation/controllers/achievement.controller';
import { BadgeManagementController } from './presentation/controllers/badge-management.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [AchievementController, BadgeManagementController],
  providers: [
    AchievementService,
    PrismaService,
    {
      provide: IAchievementRepository,
      useClass: AchievementRepository,
    },
  ],
  exports: [AchievementService],
})
export class AchievementModule {}

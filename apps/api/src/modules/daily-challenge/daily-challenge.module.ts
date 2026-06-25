import { Module } from '@nestjs/common';
import { IDailyChallengeRepository } from './domain/interfaces/daily-challenge-repository.interface';
import { DailyChallengeRepository } from './infrastructure/repositories/daily-challenge.repository';
import { DailyChallengeService } from './application/daily-challenge.service';
import { DailyChallengeController } from './presentation/controllers/daily-challenge.controller';
import { DailyChallengeManagementController } from './presentation/controllers/daily-challenge-management.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [DailyChallengeController, DailyChallengeManagementController],
  providers: [
    DailyChallengeService,
    PrismaService,
    {
      provide: IDailyChallengeRepository,
      useClass: DailyChallengeRepository,
    },
  ],
  exports: [DailyChallengeService],
})
export class DailyChallengeModule {}

import { Module } from '@nestjs/common';
import { ILeaderboardRepository } from './domain/interfaces/leaderboard-repository.interface';
import { LeaderboardRepository } from './infrastructure/repositories/leaderboard.repository';
import { LeaderboardService } from './application/leaderboard.service';
import { LeaderboardController } from './presentation/controllers/leaderboard.controller';
import { LeaderboardManagementController } from './presentation/controllers/leaderboard-management.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [LeaderboardController, LeaderboardManagementController],
  providers: [
    LeaderboardService,
    PrismaService,
    {
      provide: ILeaderboardRepository,
      useClass: LeaderboardRepository,
    },
  ],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}

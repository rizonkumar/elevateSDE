import { Module } from '@nestjs/common';
import { ILeaderboardRepository } from './domain/interfaces/leaderboard-repository.interface';
import { IPointLedgerRepository } from './domain/interfaces/point-ledger-repository.interface';
import { LeaderboardRepository } from './infrastructure/repositories/leaderboard.repository';
import { PointLedgerRepository } from './infrastructure/repositories/point-ledger.repository';
import { LeaderboardService } from './application/leaderboard.service';
import { PointsService } from './application/points.service';
import { LeaderboardController } from './presentation/controllers/leaderboard.controller';
import { LeaderboardManagementController } from './presentation/controllers/leaderboard-management.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [LeaderboardController, LeaderboardManagementController],
  providers: [
    LeaderboardService,
    PointsService,
    PrismaService,
    {
      provide: ILeaderboardRepository,
      useClass: LeaderboardRepository,
    },
    {
      provide: IPointLedgerRepository,
      useClass: PointLedgerRepository,
    },
  ],
  exports: [LeaderboardService, PointsService],
})
export class LeaderboardModule {}

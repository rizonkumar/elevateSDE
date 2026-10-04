import { Module } from '@nestjs/common';
import { IContestRepository } from './domain/interfaces/contest-repository.interface';
import { ContestRepository } from './infrastructure/repositories/contest.repository';
import { ContestService } from './application/contest.service';
import { ContestParticipationService } from './application/contest-participation.service';
import { ContestStandingsService } from './application/contest-standings.service';
import { ContestFinalizationService } from './application/contest-finalization.service';
import { ContestManagementController } from './presentation/controllers/contest-management.controller';
import { ContestsController } from './presentation/controllers/contests.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [LeaderboardModule],
  controllers: [ContestManagementController, ContestsController],
  providers: [
    ContestService,
    ContestParticipationService,
    ContestStandingsService,
    ContestFinalizationService,
    PrismaService,
    {
      provide: IContestRepository,
      useClass: ContestRepository,
    },
  ],
  exports: [ContestService, ContestFinalizationService],
})
export class ContestModule {}

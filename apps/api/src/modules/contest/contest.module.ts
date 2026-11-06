import { Module } from '@nestjs/common';
import { IContestRepository } from './domain/interfaces/contest-repository.interface';
import { ContestRepository } from './infrastructure/repositories/contest.repository';
import { ContestService } from './application/contest.service';
import { ContestParticipationService } from './application/contest-participation.service';
import { ContestStandingsService } from './application/contest-standings.service';
import { ContestFinalizationService } from './application/contest-finalization.service';
import { ContestRatingService } from './application/contest-rating.service';
import { IContestRatingRepository } from './domain/interfaces/contest-rating-repository.interface';
import { ContestRatingRepository } from './infrastructure/repositories/contest-rating.repository';
import { ContestRatingsController } from './presentation/controllers/contest-ratings.controller';
import { ContestManagementController } from './presentation/controllers/contest-management.controller';
import { ContestsController } from './presentation/controllers/contests.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [LeaderboardModule],
  controllers: [ContestManagementController, ContestRatingsController, ContestsController],
  providers: [
    ContestService,
    ContestParticipationService,
    ContestStandingsService,
    ContestFinalizationService,
    ContestRatingService,
    PrismaService,
    {
      provide: IContestRepository,
      useClass: ContestRepository,
    },
    {
      provide: IContestRatingRepository,
      useClass: ContestRatingRepository,
    },
  ],
  exports: [ContestService, ContestFinalizationService, ContestRatingService],
})
export class ContestModule {}

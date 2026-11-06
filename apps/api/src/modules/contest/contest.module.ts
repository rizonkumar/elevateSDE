import { Module } from '@nestjs/common';
import { IContestRepository } from './domain/interfaces/contest-repository.interface';
import { ContestRepository } from './infrastructure/repositories/contest.repository';
import { ContestService } from './application/contest.service';
import { ContestParticipationService } from './application/contest-participation.service';
import { ContestStandingsService } from './application/contest-standings.service';
import { ContestFinalizationService } from './application/contest-finalization.service';
import { ContestRatingService } from './application/contest-rating.service';
import { ContestLifecycleBroadcaster } from './application/contest-lifecycle-broadcaster.service';
import { ContestScheduledJobsService } from './application/contest-scheduled-jobs.service';
import { ContestLiveStandingsListener } from './presentation/listeners/contest-live-standings.listener';
import { ContestRoomAuthorizer } from './presentation/realtime/contest-room.authorizer';
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
    ContestLifecycleBroadcaster,
    ContestScheduledJobsService,
    ContestLiveStandingsListener,
    ContestRoomAuthorizer,
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
  exports: [
    ContestService,
    ContestFinalizationService,
    ContestRatingService,
    ContestLifecycleBroadcaster,
    ContestScheduledJobsService,
  ],
})
export class ContestModule {}

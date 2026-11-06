import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { ContestRatingService } from '../modules/contest/application/contest-rating.service';
import { IContestRatingRepository } from '../modules/contest/domain/interfaces/contest-rating-repository.interface';
import { ContestRatingRepository } from '../modules/contest/infrastructure/repositories/contest-rating.repository';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    PrismaService,
    ContestRatingService,
    { provide: IContestRatingRepository, useClass: ContestRatingRepository },
  ],
})
export class RatingsBackfillModule {}

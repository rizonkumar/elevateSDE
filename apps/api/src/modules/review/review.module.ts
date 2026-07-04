import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ReviewService } from './application/review.service';
import { ReviewListener } from './application/listeners/review.listener';
import { IReviewRepository } from './domain/interfaces/review-repository.interface';
import { ReviewRepository } from './infrastructure/repositories/review.repository';
import { ReviewController } from './presentation/controllers/review.controller';

@Module({
  controllers: [ReviewController],
  providers: [
    ReviewService,
    ReviewListener,
    PrismaService,
    {
      provide: IReviewRepository,
      useClass: ReviewRepository,
    },
  ],
  exports: [ReviewService],
})
export class ReviewModule {}

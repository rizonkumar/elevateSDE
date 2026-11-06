import { Injectable } from '@nestjs/common';
import { ContestRatingService } from '../../../contest/application/contest-rating.service';
import { IProfileRatingSource } from '../../domain/interfaces/profile-rating-source.interface';
import { PublicProfileRating } from '../../domain/read-models/public-profile';

@Injectable()
export class ContestRatingSource implements IProfileRatingSource {
  constructor(private readonly ratingService: ContestRatingService) {}

  async getRating(userId: string): Promise<PublicProfileRating | null> {
    return this.ratingService.findRatedSummary(userId);
  }
}

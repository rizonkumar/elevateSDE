import { PublicProfileRating } from '../read-models/public-profile';

export abstract class IProfileRatingSource {
  abstract getRating(userId: string): Promise<PublicProfileRating | null>;
}

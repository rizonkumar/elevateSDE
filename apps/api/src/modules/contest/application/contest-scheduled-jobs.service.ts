import { Injectable } from '@nestjs/common';
import { ContestFinalizationService } from './contest-finalization.service';
import { ContestLifecycleBroadcaster } from './contest-lifecycle-broadcaster.service';
import { ContestRatingService } from './contest-rating.service';

@Injectable()
export class ContestScheduledJobsService {
  constructor(
    private readonly finalizationService: ContestFinalizationService,
    private readonly ratingService: ContestRatingService,
    private readonly lifecycleBroadcaster: ContestLifecycleBroadcaster,
  ) {}

  async finalizeAndRate(): Promise<number> {
    const finalized = await this.finalizationService.finalizeEnded();
    const rated = await this.ratingService.ratePending();
    return finalized + rated;
  }

  async broadcastStatus(): Promise<number> {
    return this.lifecycleBroadcaster.broadcastRecent();
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NOTIFICATION_EVENTS,
  SubmissionAcceptedEvent,
} from '../../../notification/domain/events/notification-events';
import { ReviewService } from '../review.service';

@Injectable()
export class ReviewListener {
  private readonly logger = new Logger(ReviewListener.name);

  constructor(private readonly reviewService: ReviewService) {}

  @OnEvent(NOTIFICATION_EVENTS.SUBMISSION_ACCEPTED)
  async onSubmissionAccepted(event: SubmissionAcceptedEvent): Promise<void> {
    try {
      await this.reviewService.seedFromAcceptedSubmission(event.userId, event.problemId);
    } catch (error) {
      this.logger.error(
        'Failed to seed review item from accepted submission',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

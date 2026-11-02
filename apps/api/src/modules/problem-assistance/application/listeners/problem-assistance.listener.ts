import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NOTIFICATION_EVENTS,
  SubmissionAcceptedEvent,
} from '../../../notification/domain/events/notification-events';
import { ProblemAssistanceService } from '../problem-assistance.service';

@Injectable()
export class ProblemAssistanceListener {
  private readonly logger = new Logger(ProblemAssistanceListener.name);

  constructor(private readonly assistanceService: ProblemAssistanceService) {}

  @OnEvent(NOTIFICATION_EVENTS.SUBMISSION_ACCEPTED)
  async onSubmissionAccepted(event: SubmissionAcceptedEvent): Promise<void> {
    try {
      await this.assistanceService.recordSolved(event.userId, event.problemId);
    } catch (error) {
      this.logger.error(
        'Failed to unlock the editorial after an accepted submission',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

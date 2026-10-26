import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  MOCK_INTERVIEW_EVENTS,
  MockInterviewCompletedEvent,
} from '../../../mock-interview/domain/events/mock-interview-events';
import { InterviewPreparationService } from '../interview-preparation.service';

@Injectable()
export class MockInterviewCompletedListener {
  private readonly logger = new Logger(MockInterviewCompletedListener.name);

  constructor(private readonly service: InterviewPreparationService) {}

  @OnEvent(MOCK_INTERVIEW_EVENTS.COMPLETED)
  async onCompleted(event: MockInterviewCompletedEvent): Promise<void> {
    try {
      await this.service.recordMockInterviewCompleted(event.userId, event.preparationTaskId);
    } catch (error) {
      this.logger.error(
        `Failed to record mock interview ${event.sessionId} as readiness evidence`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

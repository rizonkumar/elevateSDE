import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { POINTS_EVENTS, PointsAwardedEvent } from '../../../leaderboard/domain/events/points-events';
import { RealtimePublisher } from '../../../realtime/domain/realtime-publisher';
import { StudyGroupActivityService } from '../../application/study-group-activity.service';
import { StudyGroupPresentationMapper } from '../mappers/study-group-presentation.mapper';

@Injectable()
export class StudyGroupActivityListener {
  private readonly logger = new Logger(StudyGroupActivityListener.name);

  constructor(
    private readonly activityService: StudyGroupActivityService,
    private readonly publisher: RealtimePublisher,
  ) {}

  @OnEvent(POINTS_EVENTS.AWARDED, { async: true })
  async onPointsAwarded(event: PointsAwardedEvent): Promise<void> {
    try {
      const { groupIds, activity } = await this.activityService.recordAward(event);
      if (!activity) {
        return;
      }
      const item = StudyGroupPresentationMapper.toActivity(activity);
      for (const groupId of groupIds) {
        this.publisher.toGroup(groupId, 'group:activity', { groupId, item });
      }
    } catch (error) {
      this.logger.error(
        `Failed to record group activity for ${event.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

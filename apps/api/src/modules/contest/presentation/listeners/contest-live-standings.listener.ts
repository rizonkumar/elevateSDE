import { Inject, Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  SUBMISSION_EVENTS,
  SubmissionJudgedEvent,
} from '../../../code-runner/domain/events/submission-events';
import { RealtimePublisher } from '../../../realtime/domain/realtime-publisher';
import {
  systemTimerScheduler,
  TIMER_SCHEDULER,
  TimerScheduler,
  TrailingCoalescer,
} from '../../../../common/trailing-coalescer';
import { ContestParticipationService } from '../../application/contest-participation.service';
import { ContestPresentationMapper } from '../mappers/contest-presentation.mapper';

export const LIVE_STANDINGS_WINDOW_MS = 2_000;

@Injectable()
export class ContestLiveStandingsListener implements OnModuleDestroy {
  private readonly logger = new Logger(ContestLiveStandingsListener.name);
  private readonly coalescer: TrailingCoalescer;

  constructor(
    private readonly participationService: ContestParticipationService,
    private readonly realtime: RealtimePublisher,
    @Optional() @Inject(TIMER_SCHEDULER) scheduler?: TimerScheduler,
  ) {
    this.coalescer = new TrailingCoalescer(
      LIVE_STANDINGS_WINDOW_MS,
      scheduler ?? systemTimerScheduler,
    );
  }

  @OnEvent(SUBMISSION_EVENTS.JUDGED)
  async onSubmissionJudged(event: SubmissionJudgedEvent): Promise<void> {
    try {
      const contestIds = await this.participationService.findLiveContestIdsForEntry(
        event.userId,
        event.problemId,
        event.judgedAt,
      );
      for (const contestId of contestIds) {
        this.coalescer.schedule(contestId, () => this.publish(contestId));
      }
    } catch (error) {
      this.logError(`Could not resolve live contests for submission ${event.submissionId}`, error);
    }
  }

  onModuleDestroy(): void {
    this.coalescer.cancelAll();
  }

  private async publish(contestId: string): Promise<void> {
    try {
      const rows = await this.participationService.liveStandings(contestId);
      if (rows === null) {
        return;
      }
      this.realtime.toContest(contestId, 'contest:standings', {
        contestId,
        rows: rows.map((row) => ContestPresentationMapper.toStandingRow(row)),
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logError(`Could not publish live standings for contest ${contestId}`, error);
    }
  }

  private logError(message: string, error: unknown): void {
    this.logger.error(message, error instanceof Error ? error.stack : undefined);
  }
}

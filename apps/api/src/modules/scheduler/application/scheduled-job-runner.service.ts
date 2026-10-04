import { Injectable, Logger } from '@nestjs/common';
import { PointsService } from '../../leaderboard/application/points.service';
import { DailyChallengeService } from '../../daily-challenge/application/daily-challenge.service';
import { ContestFinalizationService } from '../../contest/application/contest-finalization.service';
import { PeerPracticeService } from '../../interview-preparation/application/peer-practice.service';
import { SCHEDULED_JOBS, ScheduledJobName } from '../domain/scheduled-jobs';

type ScheduledJobHandler = () => Promise<number>;

@Injectable()
export class ScheduledJobRunner {
  private readonly logger = new Logger(ScheduledJobRunner.name);
  private readonly handlers: Readonly<Record<ScheduledJobName, ScheduledJobHandler>>;

  constructor(
    pointsService: PointsService,
    dailyChallengeService: DailyChallengeService,
    contestFinalizationService: ContestFinalizationService,
    peerPracticeService: PeerPracticeService,
  ) {
    this.handlers = {
      [SCHEDULED_JOBS.RESET_WEEKLY_POINTS]: () => pointsService.resetWeekly(),
      [SCHEDULED_JOBS.RESET_MONTHLY_POINTS]: () => pointsService.resetMonthly(),
      [SCHEDULED_JOBS.EXPIRE_STREAKS]: () => dailyChallengeService.expireStreaks(),
      [SCHEDULED_JOBS.FINALIZE_CONTESTS]: () => contestFinalizationService.finalizeEnded(),
      [SCHEDULED_JOBS.SWEEP_PREPARATION_REMINDERS]: () =>
        peerPracticeService.sweepPreparationReminders(),
    };
  }

  async run(name: ScheduledJobName): Promise<number> {
    const startedAt = Date.now();
    const affected = await this.handlers[name]();
    this.logger.log(`${name} completed in ${Date.now() - startedAt}ms (${affected} affected)`);
    return affected;
  }
}

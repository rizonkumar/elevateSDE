import { Injectable, Logger } from '@nestjs/common';
import { PointsService } from '../../leaderboard/application/points.service';
import { DailyChallengeService } from '../../daily-challenge/application/daily-challenge.service';
import { ContestScheduledJobsService } from '../../contest/application/contest-scheduled-jobs.service';
import { PeerPracticeService } from '../../interview-preparation/application/peer-practice.service';
import { AuthService } from '../../auth/auth.service';
import { MockInterviewService } from '../../mock-interview/application/mock-interview.service';
import { SCHEDULED_JOBS, ScheduledJobName } from '../domain/scheduled-jobs';

type ScheduledJobHandler = () => Promise<number>;

@Injectable()
export class ScheduledJobRunner {
  private readonly logger = new Logger(ScheduledJobRunner.name);
  private readonly handlers: Readonly<Record<ScheduledJobName, ScheduledJobHandler>>;

  constructor(
    pointsService: PointsService,
    dailyChallengeService: DailyChallengeService,
    contestScheduledJobs: ContestScheduledJobsService,
    peerPracticeService: PeerPracticeService,
    authService: AuthService,
    mockInterviewService: MockInterviewService,
  ) {
    this.handlers = {
      [SCHEDULED_JOBS.ROLLOVER_WEEKLY_POINTS]: () => pointsService.refreshPeriodTotals('weekly'),
      [SCHEDULED_JOBS.ROLLOVER_MONTHLY_POINTS]: () => pointsService.refreshPeriodTotals('monthly'),
      [SCHEDULED_JOBS.EXPIRE_STREAKS]: () => dailyChallengeService.expireStreaks(),
      [SCHEDULED_JOBS.FINALIZE_CONTESTS]: () => contestScheduledJobs.finalizeAndRate(),
      [SCHEDULED_JOBS.BROADCAST_CONTEST_STATUS]: () => contestScheduledJobs.broadcastStatus(),
      [SCHEDULED_JOBS.SWEEP_PREPARATION_REMINDERS]: () =>
        peerPracticeService.sweepPreparationReminders(),
      [SCHEDULED_JOBS.PRUNE_REFRESH_TOKENS]: () => authService.pruneExpiredRefreshTokens(),
      [SCHEDULED_JOBS.SWEEP_MOCK_INTERVIEWS]: () => mockInterviewService.sweep(),
    };
  }

  async run(name: ScheduledJobName): Promise<number> {
    const startedAt = Date.now();
    const affected = await this.handlers[name]();
    this.logger.log(`${name} completed in ${Date.now() - startedAt}ms (${affected} affected)`);
    return affected;
  }
}

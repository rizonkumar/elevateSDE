import { Injectable, Logger } from '@nestjs/common';
import { ContestService } from '../../contest/application/contest.service';
import { OrganizationService } from '../../organization/application/organization.service';
import { ScoringService } from '../../scoring/application/scoring.service';
import { SCHEDULED_TASKS, ScheduledTask } from '../domain/scheduled-task';

@Injectable()
export class ScheduledTaskDispatcher {
  private readonly logger = new Logger(ScheduledTaskDispatcher.name);

  constructor(
    private readonly scoringService: ScoringService,
    private readonly contestService: ContestService,
    private readonly organizationService: OrganizationService,
  ) {}

  async run(task: ScheduledTask, now: Date): Promise<void> {
    switch (task) {
      case SCHEDULED_TASKS.WEEKLY_POINTS_ROLLOVER: {
        const updated = await this.scoringService.recomputeWeeklyBucket(now);
        this.logger.log(`Recomputed weekly points for ${updated} member(s)`);
        return;
      }
      case SCHEDULED_TASKS.MONTHLY_POINTS_ROLLOVER: {
        const updated = await this.scoringService.recomputeMonthlyBucket(now);
        this.logger.log(`Recomputed monthly points for ${updated} member(s)`);
        return;
      }
      case SCHEDULED_TASKS.CONTEST_STATUS_SYNC: {
        const { toLive, toEnded } = await this.contestService.syncStatuses(now);
        if (toLive > 0 || toEnded > 0) {
          this.logger.log(`Contest transitions: ${toLive} live, ${toEnded} ended`);
        }
        return;
      }
      case SCHEDULED_TASKS.INVITATION_EXPIRY_SWEEP: {
        const expired = await this.organizationService.expireStaleInvitations(now);
        if (expired > 0) {
          this.logger.log(`Expired ${expired} stale invitation(s)`);
        }
        return;
      }
      default:
        throw new Error(`Unknown scheduled task: ${String(task)}`);
    }
  }
}

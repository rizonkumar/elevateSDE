import { Injectable } from '@nestjs/common';
import { IScheduledJobQueue } from '../../queues/domain/interfaces/scheduled-job-queue.interface';
import { AuditLogService } from '../../audit-log/application/audit-log.service';
import {
  SCHEDULED_JOB_NAMES,
  SCHEDULED_JOB_PATTERNS,
  ScheduledJobName,
} from '../domain/scheduled-jobs';
import { ScheduledJobView } from '../domain/read-models/scheduled-job-view';

const TRIGGER_AUDIT_ACTION = 'SCHEDULED_JOB_TRIGGERED';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly queue: IScheduledJobQueue,
    private readonly auditLogService: AuditLogService,
  ) {}

  listJobs(): ScheduledJobView[] {
    return SCHEDULED_JOB_NAMES.map(toView);
  }

  async trigger(name: ScheduledJobName, actorId: string): Promise<ScheduledJobView> {
    await this.queue.enqueueNow(name);
    await this.auditLogService.create(actorId, TRIGGER_AUDIT_ACTION, { job: name });
    return toView(name);
  }
}

function toView(name: ScheduledJobName): ScheduledJobView {
  return { name, pattern: SCHEDULED_JOB_PATTERNS[name] };
}

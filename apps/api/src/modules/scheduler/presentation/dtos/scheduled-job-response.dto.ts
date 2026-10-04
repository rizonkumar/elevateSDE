import { ApiProperty } from '@nestjs/swagger';
import { SCHEDULED_JOB_NAMES, ScheduledJobName } from '../../domain/scheduled-jobs';
import { ScheduledJobView } from '../../domain/read-models/scheduled-job-view';

export class ScheduledJobResponseDto implements ScheduledJobView {
  @ApiProperty({ enum: SCHEDULED_JOB_NAMES, example: 'contests.finalize' })
  name!: ScheduledJobName;

  @ApiProperty({ example: '*/5 * * * *', description: 'Cron pattern evaluated in UTC' })
  pattern!: string;
}

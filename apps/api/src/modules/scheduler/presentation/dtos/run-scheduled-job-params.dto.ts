import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { SCHEDULED_JOB_NAMES, ScheduledJobName } from '../../domain/scheduled-jobs';

export class RunScheduledJobParamsDto {
  @ApiProperty({ enum: SCHEDULED_JOB_NAMES, example: 'contests.finalize' })
  @IsIn(SCHEDULED_JOB_NAMES)
  job!: ScheduledJobName;
}

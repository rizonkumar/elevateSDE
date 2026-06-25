import { ApiProperty } from '@nestjs/swagger';
import { SubmissionAcceptedDto, SubmissionStatusValue } from '@elevatesde/shared-types';

const SUBMISSION_STATUSES: SubmissionStatusValue[] = [
  'QUEUED',
  'RUNNING',
  'ACCEPTED',
  'WRONG_ANSWER',
  'RUNTIME_ERROR',
  'TIME_LIMIT_EXCEEDED',
  'COMPILE_ERROR',
];

export class SubmissionAcceptedResponseDto implements SubmissionAcceptedDto {
  @ApiProperty({ example: 'uuid-string' })
  submissionId!: string;

  @ApiProperty({ enum: SUBMISSION_STATUSES, example: 'QUEUED' })
  status!: SubmissionStatusValue;
}

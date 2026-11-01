import { ApiProperty } from '@nestjs/swagger';
import { SubmissionPageDto } from '@elevatesde/shared-types';
import { SubmissionResponseDto } from './submission-response.dto';

export class SubmissionPageResponseDto implements SubmissionPageDto {
  @ApiProperty({ type: [SubmissionResponseDto] })
  items!: SubmissionResponseDto[];

  @ApiProperty({ example: 'uuid-submission', nullable: true })
  nextCursor!: string | null;
}

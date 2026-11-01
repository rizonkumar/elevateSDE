import { ApiProperty } from '@nestjs/swagger';
import {
  EditorialAvailability,
  EditorialUnlockReason,
  ProblemAssistanceDto,
} from '@elevatesde/shared-types';
import { ProblemHintResponseDto } from './problem-hint-response.dto';

export class ProblemAssistanceResponseDto implements ProblemAssistanceDto {
  @ApiProperty({ example: 'uuid-problem' })
  problemId!: string;

  @ApiProperty({ example: 3 })
  totalHints!: number;

  @ApiProperty({ type: [ProblemHintResponseDto] })
  hints!: ProblemHintResponseDto[];

  @ApiProperty({ enum: ['UNAVAILABLE', 'LOCKED', 'UNLOCKED'] })
  editorial!: EditorialAvailability;

  @ApiProperty({ enum: ['SOLVED', 'GAVE_UP'], nullable: true })
  unlockReason!: EditorialUnlockReason | null;

  @ApiProperty({ example: false })
  lockedByContest!: boolean;
}

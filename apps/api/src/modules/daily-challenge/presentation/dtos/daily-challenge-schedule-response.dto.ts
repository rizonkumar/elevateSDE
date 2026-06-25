import { ApiProperty } from '@nestjs/swagger';
import { AssessmentDifficulty, DailyChallengeScheduleDto } from '@elevatesde/shared-types';

export class DailyChallengeScheduleResponseDto implements DailyChallengeScheduleDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: '2026-06-25' })
  challengeDate!: string;

  @ApiProperty({ example: 'uuid-string' })
  problemId!: string;

  @ApiProperty({ example: 'Two Sum' })
  problemTitle!: string;

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  difficulty!: AssessmentDifficulty;

  @ApiProperty({ example: 42 })
  completionCount!: number;
}

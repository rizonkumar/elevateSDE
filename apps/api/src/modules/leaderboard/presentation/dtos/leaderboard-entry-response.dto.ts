import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaderboardEntryDto } from '@elevatesde/shared-types';

export class LeaderboardEntryResponseDto implements LeaderboardEntryDto {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: 'u-kenji' })
  userId!: string;

  @ApiProperty({ example: 'Kenji Watanabe' })
  name!: string;

  @ApiPropertyOptional({ example: 'Distributed systems', nullable: true })
  headline!: string | null;

  @ApiProperty({ example: 4820 })
  points!: number;

  @ApiProperty({ example: 68 })
  assessmentsCompleted!: number;

  @ApiProperty({ example: ['Top Mentor', 'System Design'], type: [String] })
  badges!: string[];

  @ApiProperty({ example: 41 })
  streakDays!: number;

  @ApiProperty({ example: false })
  isCurrentUser!: boolean;
}

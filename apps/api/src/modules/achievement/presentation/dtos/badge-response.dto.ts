import { ApiProperty } from '@nestjs/swagger';
import { BadgeCriteriaType, BadgeDto } from '@elevatesde/shared-types';

export class BadgeResponseDto implements BadgeDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'first-blood' })
  key!: string;

  @ApiProperty({ example: 'First Blood' })
  name!: string;

  @ApiProperty({ example: 'Solve your first problem.' })
  description!: string;

  @ApiProperty({ example: 'Swords' })
  icon!: string;

  @ApiProperty({
    enum: ['PROBLEMS_SOLVED', 'STREAK_DAYS', 'ASSESSMENTS_COMPLETED', 'FORUM_POSTS', 'POINTS'],
  })
  criteriaType!: BadgeCriteriaType;

  @ApiProperty({ example: 1 })
  threshold!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

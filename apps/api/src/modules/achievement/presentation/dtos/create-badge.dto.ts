import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsString, Min, MinLength } from 'class-validator';
import { BadgeCriteriaType, CreateBadgeDto as ICreateBadgeDto } from '@elevatesde/shared-types';

const CRITERIA_TYPES: BadgeCriteriaType[] = [
  'PROBLEMS_SOLVED',
  'STREAK_DAYS',
  'ASSESSMENTS_COMPLETED',
  'FORUM_POSTS',
  'POINTS',
];

export class CreateBadgeDto implements ICreateBadgeDto {
  @ApiProperty({ example: 'first-blood' })
  @IsString()
  @MinLength(1)
  key!: string;

  @ApiProperty({ example: 'First Blood' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'Solve your first problem.' })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty({ example: 'Swords' })
  @IsString()
  @MinLength(1)
  icon!: string;

  @ApiProperty({ enum: CRITERIA_TYPES })
  @IsIn(CRITERIA_TYPES)
  criteriaType!: BadgeCriteriaType;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  threshold!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;
}

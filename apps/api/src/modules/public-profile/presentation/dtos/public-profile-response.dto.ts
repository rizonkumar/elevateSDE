import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AssessmentDifficulty,
  PublicProfileBadgeDto,
  PublicProfileDifficultyCountDto,
  PublicProfileDto,
  PublicProfileLinksDto,
  PublicProfileRatingDto,
  PublicProfileRecentSolveDto,
  PublicProfileSolvedDto,
  PublicProfileStreakDto,
  PublicProfileTopicDto,
  SubmissionHeatmapCellDto,
} from '@elevatesde/shared-types';

export class PublicProfileLinksResponseDto implements PublicProfileLinksDto {
  @ApiPropertyOptional({ nullable: true })
  github!: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkedin!: string | null;

  @ApiPropertyOptional({ nullable: true })
  website!: string | null;
}

export class PublicProfileDifficultyCountResponseDto implements PublicProfileDifficultyCountDto {
  @ApiProperty({ example: 12 })
  solved!: number;

  @ApiProperty({ example: 140 })
  total!: number;
}

export class PublicProfileSolvedResponseDto implements PublicProfileSolvedDto {
  @ApiProperty({ example: 42 })
  solved!: number;

  @ApiProperty({ example: 380 })
  total!: number;

  @ApiProperty({
    example: {
      EASY: { solved: 20, total: 140 },
      MEDIUM: { solved: 18, total: 180 },
      HARD: { solved: 4, total: 60 },
    },
  })
  byDifficulty!: Record<AssessmentDifficulty, PublicProfileDifficultyCountResponseDto>;
}

export class PublicProfileTopicResponseDto implements PublicProfileTopicDto {
  @ApiProperty({ example: 'dynamic-programming' })
  slug!: string;

  @ApiProperty({ example: 'Dynamic Programming' })
  name!: string;

  @ApiProperty({ example: 9 })
  solved!: number;
}

export class PublicProfileBadgeResponseDto implements PublicProfileBadgeDto {
  @ApiProperty({ example: 'first-blood' })
  key!: string;

  @ApiProperty({ example: 'First Blood' })
  name!: string;

  @ApiProperty({ example: 'Solve your first problem.' })
  description!: string;

  @ApiProperty({ example: 'Trophy' })
  icon!: string;

  @ApiProperty({ example: '2026-06-15T08:11:29Z' })
  awardedAt!: string;
}

export class PublicProfileRecentSolveResponseDto implements PublicProfileRecentSolveDto {
  @ApiProperty({ example: 'two-sum' })
  slug!: string;

  @ApiProperty({ example: 'Two Sum' })
  title!: string;

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  difficulty!: AssessmentDifficulty;

  @ApiProperty({ example: '2026-06-15T08:11:29Z' })
  solvedAt!: string;
}

export class PublicProfileStreakResponseDto implements PublicProfileStreakDto {
  @ApiProperty({ example: 4 })
  current!: number;

  @ApiProperty({ example: 21 })
  longest!: number;
}

export class PublicProfileHeatmapCellResponseDto implements SubmissionHeatmapCellDto {
  @ApiProperty({ example: '2026-06-15' })
  date!: string;

  @ApiProperty({ example: 3 })
  count!: number;
}

export class PublicProfileRatingResponseDto implements PublicProfileRatingDto {
  @ApiProperty({ example: 1540 })
  rating!: number;

  @ApiProperty({ example: 1588 })
  peakRating!: number;

  @ApiProperty({ example: 4 })
  contestsRated!: number;
}

export class PublicProfileResponseDto implements PublicProfileDto {
  @ApiProperty({ example: 'ada-lovelace' })
  handle!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  headline!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio!: string | null;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiProperty({ type: PublicProfileLinksResponseDto })
  links!: PublicProfileLinksResponseDto;

  @ApiPropertyOptional({ nullable: true })
  organizationName!: string | null;

  @ApiProperty({ example: '2026-01-04T10:00:00Z' })
  joinedAt!: string;

  @ApiProperty({ example: 1280 })
  points!: number;

  @ApiProperty({ type: PublicProfileStreakResponseDto })
  streak!: PublicProfileStreakResponseDto;

  @ApiProperty({ type: PublicProfileSolvedResponseDto })
  solved!: PublicProfileSolvedResponseDto;

  @ApiProperty({ type: [PublicProfileTopicResponseDto] })
  topTopics!: PublicProfileTopicResponseDto[];

  @ApiProperty({ type: [PublicProfileBadgeResponseDto] })
  badges!: PublicProfileBadgeResponseDto[];

  @ApiProperty({ type: [PublicProfileHeatmapCellResponseDto] })
  heatmap!: PublicProfileHeatmapCellResponseDto[];

  @ApiProperty({ type: [PublicProfileRecentSolveResponseDto] })
  recentSolves!: PublicProfileRecentSolveResponseDto[];

  @ApiPropertyOptional({ type: PublicProfileRatingResponseDto, nullable: true })
  rating!: PublicProfileRatingResponseDto | null;
}

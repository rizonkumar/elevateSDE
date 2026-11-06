import { ApiProperty } from '@nestjs/swagger';
import {
  ContestRatingHistoryEntryDto,
  ContestRatingLeaderboardDto,
  ContestRatingLeaderboardEntryDto,
  ContestRatingSummaryDto,
} from '@elevatesde/shared-types';

export class ContestRatingHistoryEntryResponseDto implements ContestRatingHistoryEntryDto {
  @ApiProperty({ example: 'uuid-string' })
  contestId!: string;

  @ApiProperty({ example: 'weekly-sprint-12' })
  slug!: string;

  @ApiProperty({ example: 'Weekly Sprint #12' })
  title!: string;

  @ApiProperty({ example: '2026-07-19T19:30:00.000Z' })
  endsAt!: string;

  @ApiProperty({ example: 4 })
  rank!: number;

  @ApiProperty({ example: 1540 })
  oldRating!: number;

  @ApiProperty({ example: 1588 })
  newRating!: number;

  @ApiProperty({ example: 48 })
  delta!: number;
}

export class ContestRatingSummaryResponseDto implements ContestRatingSummaryDto {
  @ApiProperty({ example: 1588 })
  rating!: number;

  @ApiProperty({ example: 1612 })
  peakRating!: number;

  @ApiProperty({ example: 6 })
  contestsRated!: number;

  @ApiProperty({ type: [ContestRatingHistoryEntryResponseDto] })
  history!: ContestRatingHistoryEntryResponseDto[];
}

export class ContestRatingLeaderboardEntryResponseDto implements ContestRatingLeaderboardEntryDto {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: 'uuid-string' })
  userId!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name!: string;

  @ApiProperty({ example: 'ada', nullable: true, type: String })
  publicHandle!: string | null;

  @ApiProperty({ example: 1588 })
  rating!: number;

  @ApiProperty({ example: 1612 })
  peakRating!: number;

  @ApiProperty({ example: 6 })
  contestsRated!: number;

  @ApiProperty({ example: false })
  isCurrentUser!: boolean;
}

export class ContestRatingLeaderboardResponseDto implements ContestRatingLeaderboardDto {
  @ApiProperty({ type: [ContestRatingLeaderboardEntryResponseDto] })
  items!: ContestRatingLeaderboardEntryResponseDto[];

  @ApiProperty({ example: 120 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 25 })
  pageSize!: number;
}

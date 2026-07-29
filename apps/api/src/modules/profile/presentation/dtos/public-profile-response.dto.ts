import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BadgeCriteriaType } from '@prisma/client';
import {
  PublicProblemCollectionSummaryDto,
  PublicProfileDto,
  PublicProfileStatsDto,
  SubmissionHeatmapCellDto,
  UserBadgeDto,
} from '@elevatesde/shared-types';

export class PublicProfileStatsResponseDto implements PublicProfileStatsDto {
  @ApiProperty() points!: number;
  @ApiPropertyOptional({ nullable: true }) rank!: number | null;
  @ApiProperty() streakDays!: number;
  @ApiProperty() longestStreak!: number;
  @ApiProperty() problemsSolved!: number;
  @ApiProperty() acceptanceRate!: number;
  @ApiProperty({ type: Object }) byDifficulty!: Record<string, number>;
}

export class PublicBadgeResponseDto implements UserBadgeDto {
  @ApiProperty() id!: string;
  @ApiProperty() key!: string;
  @ApiProperty() name!: string;
  @ApiProperty() description!: string;
  @ApiProperty() icon!: string;
  @ApiProperty({ enum: BadgeCriteriaType }) criteriaType!: BadgeCriteriaType;
  @ApiProperty() threshold!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() awardedAt!: string;
}

export class PublicHeatmapCellResponseDto implements SubmissionHeatmapCellDto {
  @ApiProperty() date!: string;
  @ApiProperty() count!: number;
}

export class PublicListSummaryResponseDto implements PublicProblemCollectionSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() itemCount!: number;
  @ApiProperty() createdAt!: string;
}

export class PublicProfileResponseDto implements PublicProfileDto {
  @ApiProperty() handle!: string;
  @ApiPropertyOptional({ nullable: true }) firstName!: string | null;
  @ApiPropertyOptional({ nullable: true }) lastName!: string | null;
  @ApiPropertyOptional({ nullable: true }) headline!: string | null;
  @ApiPropertyOptional({ nullable: true }) bio!: string | null;
  @ApiPropertyOptional({ nullable: true }) githubUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) linkedinUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) websiteUrl!: string | null;
  @ApiProperty() joinedAt!: string;
  @ApiProperty({ type: PublicProfileStatsResponseDto }) stats!: PublicProfileStatsResponseDto;
  @ApiProperty({ type: [PublicBadgeResponseDto] }) badges!: PublicBadgeResponseDto[];
  @ApiProperty({ type: [PublicHeatmapCellResponseDto] })
  heatmap!: PublicHeatmapCellResponseDto[];
  @ApiProperty({ type: [PublicListSummaryResponseDto] })
  publicLists!: PublicListSummaryResponseDto[];
}

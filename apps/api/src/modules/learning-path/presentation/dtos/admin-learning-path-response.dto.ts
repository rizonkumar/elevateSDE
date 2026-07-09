import { ApiProperty } from '@nestjs/swagger';
import {
  AdminLearningPathDetailDto,
  AdminLearningPathListDto,
  AdminLearningPathModuleDto,
  AdminLearningPathModuleItemDto,
  AdminLearningPathSummaryDto,
  AssessmentDifficulty,
  PathLevel,
} from '@elevatesde/shared-types';

export class AdminLearningPathSummaryResponseDto implements AdminLearningPathSummaryDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'faang-dsa-prep' })
  slug!: string;

  @ApiProperty({ example: 'FAANG DSA Prep' })
  title!: string;

  @ApiProperty({ enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
  level!: PathLevel;

  @ApiProperty({ example: 3 })
  moduleCount!: number;

  @ApiProperty({ example: 12 })
  problemCount!: number;

  @ApiProperty({ example: false })
  isPublished!: boolean;

  @ApiProperty({ example: '2026-07-08T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-08T00:00:00.000Z' })
  updatedAt!: string;
}

export class AdminLearningPathModuleItemResponseDto implements AdminLearningPathModuleItemDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'uuid-string' })
  problemId!: string;

  @ApiProperty({ example: 'Two Sum' })
  title!: string;

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  difficulty!: AssessmentDifficulty;

  @ApiProperty({ example: 0 })
  order!: number;
}

export class AdminLearningPathModuleResponseDto implements AdminLearningPathModuleDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'Arrays & Hashing' })
  title!: string;

  @ApiProperty({ example: 0 })
  order!: number;

  @ApiProperty({ type: [AdminLearningPathModuleItemResponseDto] })
  items!: AdminLearningPathModuleItemResponseDto[];
}

export class AdminLearningPathDetailResponseDto
  extends AdminLearningPathSummaryResponseDto
  implements AdminLearningPathDetailDto
{
  @ApiProperty({ example: 'A structured roadmap covering core data structures.' })
  description!: string;

  @ApiProperty({ example: ['arrays', 'graphs'], type: [String] })
  tags!: string[];

  @ApiProperty({ example: null, nullable: true })
  coverImage!: string | null;

  @ApiProperty({ type: [AdminLearningPathModuleResponseDto] })
  modules!: AdminLearningPathModuleResponseDto[];
}

export class AdminLearningPathListResponseDto implements AdminLearningPathListDto {
  @ApiProperty({ type: [AdminLearningPathSummaryResponseDto] })
  items!: AdminLearningPathSummaryResponseDto[];

  @ApiProperty({ example: 4 })
  total!: number;
}

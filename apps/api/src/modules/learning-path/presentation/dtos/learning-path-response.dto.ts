import { ApiProperty } from '@nestjs/swagger';
import {
  AssessmentDifficulty,
  LearningPathDetailDto,
  LearningPathDto,
  LearningPathItemDto,
  LearningPathModuleDto,
  PathLevel,
  PathProgressDto,
} from '@elevatesde/shared-types';

export class PathProgressResponseDto implements PathProgressDto {
  @ApiProperty({ example: 3 })
  solved!: number;

  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ example: 25 })
  percent!: number;
}

export class LearningPathResponseDto implements LearningPathDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'faang-dsa-prep' })
  slug!: string;

  @ApiProperty({ example: 'FAANG DSA Prep' })
  title!: string;

  @ApiProperty({ example: 'A structured roadmap covering core data structures.' })
  description!: string;

  @ApiProperty({ enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
  level!: PathLevel;

  @ApiProperty({ example: ['arrays', 'graphs'], type: [String] })
  tags!: string[];

  @ApiProperty({ example: null, nullable: true })
  coverImage!: string | null;

  @ApiProperty({ example: 3 })
  moduleCount!: number;

  @ApiProperty({ example: 12 })
  problemCount!: number;

  @ApiProperty({ example: false })
  enrolled!: boolean;

  @ApiProperty({ type: PathProgressResponseDto })
  progress!: PathProgressResponseDto;
}

export class LearningPathItemResponseDto implements LearningPathItemDto {
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

  @ApiProperty({ example: false })
  solved!: boolean;
}

export class LearningPathModuleResponseDto implements LearningPathModuleDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'Arrays & Hashing' })
  title!: string;

  @ApiProperty({ example: 0 })
  order!: number;

  @ApiProperty({ type: [LearningPathItemResponseDto] })
  items!: LearningPathItemResponseDto[];
}

export class LearningPathDetailResponseDto implements LearningPathDetailDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'faang-dsa-prep' })
  slug!: string;

  @ApiProperty({ example: 'FAANG DSA Prep' })
  title!: string;

  @ApiProperty({ example: 'A structured roadmap covering core data structures.' })
  description!: string;

  @ApiProperty({ enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
  level!: PathLevel;

  @ApiProperty({ example: ['arrays', 'graphs'], type: [String] })
  tags!: string[];

  @ApiProperty({ example: null, nullable: true })
  coverImage!: string | null;

  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiProperty({ example: true })
  enrolled!: boolean;

  @ApiProperty({ type: PathProgressResponseDto })
  progress!: PathProgressResponseDto;

  @ApiProperty({ example: 'uuid-string', nullable: true })
  resumeProblemId!: string | null;

  @ApiProperty({ type: [LearningPathModuleResponseDto] })
  modules!: LearningPathModuleResponseDto[];
}

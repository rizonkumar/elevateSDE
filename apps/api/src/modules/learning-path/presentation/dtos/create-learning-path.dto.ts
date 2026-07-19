import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AdminLearningPathInput, PathLevel } from '@elevatesde/shared-types';

const PATH_LEVELS: PathLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export class CreateLearningPathDto implements AdminLearningPathInput {
  @ApiProperty({ example: 'FAANG DSA Prep' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 'faang-dsa-prep' })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiProperty({
    example: 'A structured roadmap covering arrays, graphs, and dynamic programming.',
  })
  @IsString()
  description!: string;

  @ApiProperty({ enum: PATH_LEVELS })
  @IsIn(PATH_LEVELS)
  level!: PathLevel;

  @ApiProperty({ example: ['arrays', 'graphs'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.png', nullable: true })
  @IsOptional()
  @IsString()
  coverImage?: string | null;
}

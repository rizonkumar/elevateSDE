import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AssessmentDifficulty } from '@prisma/client';

export class ListProblemsQueryDto {
  @ApiPropertyOptional({ enum: AssessmentDifficulty })
  @IsEnum(AssessmentDifficulty)
  @IsOptional()
  difficulty?: AssessmentDifficulty;

  @ApiPropertyOptional({ example: 'Array' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ example: 'two sum' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;
}

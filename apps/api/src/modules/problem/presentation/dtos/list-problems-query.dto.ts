import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AssessmentDifficulty } from '@prisma/client';
import { ProblemProgressStatus } from '@elevatesde/shared-types';

const PROGRESS_STATUSES: ProblemProgressStatus[] = ['SOLVED', 'ATTEMPTED', 'TODO'];

function scalarToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

function toStringList(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const raw: unknown[] = Array.isArray(value) ? value : scalarToString(value).split(',');
  return raw.map((item) => scalarToString(item).trim()).filter((item) => item.length > 0);
}

export class ListProblemsQueryDto {
  @ApiPropertyOptional({ enum: AssessmentDifficulty })
  @IsEnum(AssessmentDifficulty)
  @IsOptional()
  difficulty?: AssessmentDifficulty;

  @ApiPropertyOptional({
    example: 'sliding-window,two-pointers',
    description: 'Comma-separated topic slugs. Matches problems with any of them.',
  })
  @Transform(({ value }) => toStringList(value))
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @IsOptional()
  topics?: string[];

  @ApiPropertyOptional({
    example: 'amazon',
    description: 'Company slug. Results are ordered by how often the company asks them.',
  })
  @IsString()
  @MaxLength(80)
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ enum: PROGRESS_STATUSES })
  @IsIn(PROGRESS_STATUSES)
  @IsOptional()
  status?: ProblemProgressStatus;

  @ApiPropertyOptional({ example: 'two sum' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: true, description: 'Only problems that have test cases' })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  hasTestCases?: boolean;

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

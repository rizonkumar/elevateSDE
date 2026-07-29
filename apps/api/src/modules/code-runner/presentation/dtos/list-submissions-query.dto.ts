import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SubmissionStatus } from '@prisma/client';
import { AssessmentLanguage } from '@elevatesde/shared-types';

const LANGUAGES: AssessmentLanguage[] = ['javascript', 'python', 'cpp'];

export class ListSubmissionsQueryDto {
  @ApiPropertyOptional({ example: 'uuid-problem' })
  @IsString()
  @IsOptional()
  problemId?: string;

  @ApiPropertyOptional({ enum: SubmissionStatus })
  @IsEnum(SubmissionStatus)
  @IsOptional()
  status?: SubmissionStatus;

  @ApiPropertyOptional({ enum: LANGUAGES })
  @IsIn(LANGUAGES)
  @IsOptional()
  language?: AssessmentLanguage;

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

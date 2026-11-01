import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export const MAX_SUBMISSION_PAGE_SIZE = 50;

export class ListSubmissionsQueryDto {
  @ApiProperty({ example: 'uuid-problem' })
  @IsUUID()
  problemId!: string;

  @ApiPropertyOptional({ example: 'uuid-submission' })
  @IsUUID()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SUBMISSION_PAGE_SIZE)
  @IsOptional()
  limit?: number;
}

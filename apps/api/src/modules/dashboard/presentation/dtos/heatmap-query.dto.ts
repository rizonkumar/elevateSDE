import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class HeatmapQueryDto {
  @ApiPropertyOptional({ example: '2025-06-25' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-25' })
  @IsDateString()
  @IsOptional()
  to?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { LeaderboardTimeframe } from '@elevatesde/shared-types';

const TIMEFRAMES: LeaderboardTimeframe[] = ['all-time', 'monthly', 'weekly'];

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ enum: TIMEFRAMES, default: 'all-time' })
  @IsIn(TIMEFRAMES)
  @IsOptional()
  timeframe?: LeaderboardTimeframe;
}

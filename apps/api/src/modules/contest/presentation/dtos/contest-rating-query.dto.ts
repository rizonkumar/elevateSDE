import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ContestRatingScope } from '@elevatesde/shared-types';

const SCOPES: ContestRatingScope[] = ['platform', 'tenant'];

export const MAX_RATING_PAGE = 1000;

export class ContestRatingLeaderboardQueryDto {
  @ApiPropertyOptional({ enum: SCOPES, default: 'platform' })
  @IsOptional()
  @IsIn(SCOPES)
  scope?: ContestRatingScope;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RATING_PAGE)
  page?: number;
}

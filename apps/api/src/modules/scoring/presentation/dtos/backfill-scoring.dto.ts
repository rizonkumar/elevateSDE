import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class BackfillScoringDto {
  @ApiPropertyOptional({
    description: 'Compute the totals and roll the transaction back without persisting.',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: 'Re-evaluate badges for every user with awards after the backfill.',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  evaluateBadges?: boolean;
}

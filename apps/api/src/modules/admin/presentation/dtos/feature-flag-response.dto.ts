import { ApiProperty } from '@nestjs/swagger';

export class FeatureFlagResponseDto {
  @ApiProperty({ example: 'uuid-flag-string' })
  id!: string;

  @ApiProperty({ example: 'NEW_DASHBOARD_UI' })
  flagKey!: string;

  @ApiProperty({ example: false })
  isEnabled!: boolean;

  @ApiProperty({ example: 100 })
  percentageRollout!: number;

  @ApiProperty({ example: '2026-06-15T08:11:29Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-15T08:11:29Z' })
  updatedAt!: string;
}

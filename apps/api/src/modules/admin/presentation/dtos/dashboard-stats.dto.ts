import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardStatsDto {
  @ApiProperty({ example: 120 })
  totalUsers!: number;

  @ApiProperty({ example: 15 })
  totalTenants!: number;

  @ApiProperty({ example: 5 })
  activeFeatureFlagsCount!: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'NEW_DASHBOARD_UI' })
  @IsString()
  flagKey!: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  percentageRollout?: number;
}

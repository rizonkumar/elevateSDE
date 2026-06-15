import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleFeatureFlagDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isEnabled!: boolean;
}

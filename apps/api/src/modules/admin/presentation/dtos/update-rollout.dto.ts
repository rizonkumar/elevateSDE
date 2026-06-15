import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class UpdateRolloutDto {
  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentageRollout!: number;
}

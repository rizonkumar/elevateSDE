import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class HandleAvailabilityQueryDto {
  @ApiProperty({ example: 'ada-lovelace' })
  @IsString()
  @MaxLength(64)
  handle!: string;
}

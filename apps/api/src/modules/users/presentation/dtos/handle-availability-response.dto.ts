import { ApiProperty } from '@nestjs/swagger';
import { HandleAvailabilityDto } from '@elevatesde/shared-types';

export class HandleAvailabilityResponseDto implements HandleAvailabilityDto {
  @ApiProperty({ example: 'ada-lovelace' })
  handle!: string;

  @ApiProperty({ example: true })
  available!: boolean;
}

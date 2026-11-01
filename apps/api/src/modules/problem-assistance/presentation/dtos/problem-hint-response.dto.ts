import { ApiProperty } from '@nestjs/swagger';
import { ProblemHintDto } from '@elevatesde/shared-types';

export class ProblemHintResponseDto implements ProblemHintDto {
  @ApiProperty({ example: 1 })
  ordinal!: number;

  @ApiProperty({ example: 'Can you trade memory for time with a lookup table?' })
  content!: string;
}

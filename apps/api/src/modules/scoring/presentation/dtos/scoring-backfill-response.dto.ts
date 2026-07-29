import { ApiProperty } from '@nestjs/swagger';
import { ScoringBackfillResultDto } from '@elevatesde/shared-types';

export class ScoringBackfillResponseDto implements ScoringBackfillResultDto {
  @ApiProperty()
  usersTouched!: number;

  @ApiProperty()
  awardsInserted!: number;

  @ApiProperty()
  pointsAwarded!: number;

  @ApiProperty()
  dryRun!: boolean;
}

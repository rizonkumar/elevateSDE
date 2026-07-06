import { ApiProperty } from '@nestjs/swagger';
import { AdminContestSummaryDto, ContestStatus } from '@elevatesde/shared-types';

export class ContestSummaryResponseDto implements AdminContestSummaryDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'weekly-sprint-12' })
  slug!: string;

  @ApiProperty({ example: 'Weekly Sprint #12' })
  title!: string;

  @ApiProperty({ enum: ['DRAFT', 'SCHEDULED', 'LIVE', 'ENDED'] })
  status!: ContestStatus;

  @ApiProperty({ example: '2026-07-10T18:00:00.000Z' })
  startsAt!: string;

  @ApiProperty({ example: '2026-07-10T19:30:00.000Z' })
  endsAt!: string;

  @ApiProperty({ example: 3 })
  problemCount!: number;

  @ApiProperty({ example: '2026-07-05T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-05T12:00:00.000Z' })
  updatedAt!: string;
}

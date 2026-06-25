import { ApiProperty } from '@nestjs/swagger';
import { StreakCalendarCellDto, StreakSummaryDto } from '@elevatesde/shared-types';

export class StreakCalendarCellResponseDto implements StreakCalendarCellDto {
  @ApiProperty({ example: '2026-06-25' })
  date!: string;

  @ApiProperty({ example: true })
  completed!: boolean;
}

export class StreakSummaryResponseDto implements StreakSummaryDto {
  @ApiProperty({ example: 7 })
  current!: number;

  @ApiProperty({ example: 21 })
  longest!: number;

  @ApiProperty({ example: '2026-06-25', nullable: true })
  lastActiveDate!: string | null;

  @ApiProperty({ type: [StreakCalendarCellResponseDto] })
  calendar!: StreakCalendarCellResponseDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { ReviewForecastDayDto, ReviewSummaryDto } from '@elevatesde/shared-types';

export class ReviewForecastDayResponseDto implements ReviewForecastDayDto {
  @ApiProperty({ example: '2026-07-25' })
  date!: string;

  @ApiProperty({ example: 3 })
  count!: number;
}

export class ReviewSummaryResponseDto implements ReviewSummaryDto {
  @ApiProperty({ example: 7 })
  dueCount!: number;

  @ApiProperty({ example: 42 })
  trackedCount!: number;

  @ApiProperty({ example: 18 })
  reviewedCount!: number;

  @ApiProperty({ type: [ReviewForecastDayResponseDto] })
  forecast!: ReviewForecastDayResponseDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { SubmissionHeatmapCellDto, SubmissionHeatmapDto } from '@elevatesde/shared-types';

export class SubmissionHeatmapCellResponseDto implements SubmissionHeatmapCellDto {
  @ApiProperty({ example: '2026-06-25' })
  date!: string;

  @ApiProperty({ example: 3 })
  count!: number;
}

export class SubmissionHeatmapResponseDto implements SubmissionHeatmapDto {
  @ApiProperty({ type: [SubmissionHeatmapCellResponseDto] })
  cells!: SubmissionHeatmapCellResponseDto[];
}

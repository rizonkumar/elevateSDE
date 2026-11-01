import { ApiProperty } from '@nestjs/swagger';
import {
  AssessmentLanguage,
  HistogramBucketDto,
  PerformanceDistributionDto,
} from '@elevatesde/shared-types';

export class HistogramBucketResponseDto implements HistogramBucketDto {
  @ApiProperty({ example: 12 })
  from!: number;

  @ApiProperty({ example: 18 })
  to!: number;

  @ApiProperty({ example: 7 })
  count!: number;
}

export class PerformanceDistributionResponseDto implements PerformanceDistributionDto {
  @ApiProperty({ example: 'uuid-problem' })
  problemId!: string;

  @ApiProperty({ enum: ['javascript', 'python', 'cpp', 'java', 'go'] })
  language!: AssessmentLanguage;

  @ApiProperty({ example: 128 })
  sampleSize!: number;

  @ApiProperty({ type: [HistogramBucketResponseDto], description: 'Runtime in milliseconds' })
  runtime!: HistogramBucketResponseDto[];

  @ApiProperty({ type: [HistogramBucketResponseDto], description: 'Peak memory in KB' })
  memory!: HistogramBucketResponseDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import { GradeReviewDto as IGradeReviewDto, ReviewQuality } from '@elevatesde/shared-types';

export class GradeReviewDto implements IGradeReviewDto {
  @ApiProperty({ example: 4, minimum: 0, maximum: 5 })
  @IsInt()
  @Min(0)
  @Max(5)
  quality!: ReviewQuality;
}

import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, IsString, Max, Min } from 'class-validator';

export class AdjustLeaderboardDto {
  @ApiProperty({ example: 4820 })
  @IsInt()
  @Min(0)
  @Max(1000000)
  points!: number;

  @ApiProperty({ example: ['Top Mentor', 'System Design'], type: [String] })
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  badges!: string[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateForumReportDto {
  @ApiProperty({ example: 'Spam or self-promotion' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

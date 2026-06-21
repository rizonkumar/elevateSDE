import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateForumCommentDto {
  @ApiProperty({ example: 'Use local token buckets per node with periodic reconciliation.' })
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  body!: string;
}

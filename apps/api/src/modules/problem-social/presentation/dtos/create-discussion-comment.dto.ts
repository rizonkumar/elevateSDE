import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDiscussionCommentDto {
  @ApiProperty({ example: 'The two-pointer version only works when the array is sorted.' })
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  body!: string;
}

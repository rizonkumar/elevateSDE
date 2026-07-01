import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProblemDiscussionDto {
  @ApiProperty({ example: 'Cleaner two-pointer approach?' })
  @IsString()
  @MinLength(8)
  @MaxLength(180)
  title!: string;

  @ApiProperty({ example: 'I solved this with a hash map but wondered about the two-pointer...' })
  @IsString()
  @MinLength(8)
  @MaxLength(8000)
  body!: string;
}

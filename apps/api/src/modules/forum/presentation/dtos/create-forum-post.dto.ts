import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateForumPostDto {
  @ApiProperty({ example: 'How would you design a distributed rate limiter?' })
  @IsString()
  @MinLength(8)
  @MaxLength(180)
  title!: string;

  @ApiProperty({ example: 'I went with a token bucket per client in Redis...' })
  @IsString()
  @MinLength(8)
  @MaxLength(8000)
  body!: string;

  @ApiProperty({ example: ['system-design', 'faang'], type: [String] })
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  tags!: string[];
}

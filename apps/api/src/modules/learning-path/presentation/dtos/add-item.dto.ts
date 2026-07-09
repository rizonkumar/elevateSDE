import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AddItemDto {
  @ApiProperty({ example: 'uuid-string' })
  @IsString()
  @MinLength(1)
  problemId!: string;
}

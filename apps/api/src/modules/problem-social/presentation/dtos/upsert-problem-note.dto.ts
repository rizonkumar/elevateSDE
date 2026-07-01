import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpsertProblemNoteDto {
  @ApiProperty({ example: 'Remember to handle the empty-input edge case.' })
  @IsString()
  @MaxLength(8000)
  body!: string;
}

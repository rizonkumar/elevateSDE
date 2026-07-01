import { ApiProperty } from '@nestjs/swagger';
import { ProblemNoteDto } from '@elevatesde/shared-types';

export class ProblemNoteResponseDto implements ProblemNoteDto {
  @ApiProperty({ example: 'uuid-problem' })
  problemId!: string;

  @ApiProperty({ example: 'Remember to handle the empty-input edge case.' })
  body!: string;

  @ApiProperty({ example: '2026-07-01T08:05:00.000Z' })
  updatedAt!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { AdminCodingProblemDto } from '@elevatesde/shared-types';
import { CodingProblemResponseDto } from './coding-problem-response.dto';

export class AdminCodingProblemResponseDto
  extends CodingProblemResponseDto
  implements AdminCodingProblemDto
{
  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiProperty({ example: '2026-01-12T09:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-02-04T11:30:00.000Z' })
  updatedAt!: string;
}

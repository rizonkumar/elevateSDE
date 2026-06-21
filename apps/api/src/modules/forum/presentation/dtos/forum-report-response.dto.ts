import { ApiProperty } from '@nestjs/swagger';
import { ForumReportDto } from '@elevatesde/shared-types';

export class ForumReportResponseDto implements ForumReportDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'Spam or self-promotion' })
  reason!: string;

  @ApiProperty({ example: '2026-06-19T08:05:00.000Z' })
  createdAt!: string;
}

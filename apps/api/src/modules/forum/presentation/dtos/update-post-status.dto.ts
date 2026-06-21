import { ApiProperty } from '@nestjs/swagger';
import { ForumPostStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdatePostStatusDto {
  @ApiProperty({ enum: ForumPostStatus })
  @IsEnum(ForumPostStatus)
  status!: ForumPostStatus;
}

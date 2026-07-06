import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PublishContestDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  publish!: boolean;
}

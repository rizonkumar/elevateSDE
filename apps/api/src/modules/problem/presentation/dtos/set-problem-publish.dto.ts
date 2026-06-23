import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetProblemPublishDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isPublished!: boolean;
}

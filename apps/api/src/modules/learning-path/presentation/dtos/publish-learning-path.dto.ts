import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PublishLearningPathDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  publish!: boolean;
}

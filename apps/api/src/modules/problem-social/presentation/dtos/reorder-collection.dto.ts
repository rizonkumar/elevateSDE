import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class ReorderCollectionDto {
  @ApiProperty({ example: ['uuid-c', 'uuid-a', 'uuid-b'], type: [String] })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  orderedProblemIds!: string[];
}

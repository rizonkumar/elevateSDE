import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddCollectionItemDto {
  @ApiProperty({ example: 'uuid-string' })
  @IsUUID()
  problemId!: string;
}

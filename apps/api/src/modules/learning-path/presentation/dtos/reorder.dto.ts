import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ReorderDirection } from '@elevatesde/shared-types';

const DIRECTIONS: ReorderDirection[] = ['up', 'down'];

export class ReorderDto {
  @ApiProperty({ enum: DIRECTIONS })
  @IsIn(DIRECTIONS)
  direction!: ReorderDirection;
}

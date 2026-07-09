import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ModuleInputDto {
  @ApiProperty({ example: 'Arrays & Hashing' })
  @IsString()
  @MinLength(1)
  title!: string;
}

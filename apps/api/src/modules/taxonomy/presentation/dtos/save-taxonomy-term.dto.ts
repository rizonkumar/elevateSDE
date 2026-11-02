import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AdminTaxonomyInput } from '@elevatesde/shared-types';
import { MAX_TERM_NAME_LENGTH } from '../../domain/entities/taxonomy-term';

export class SaveTaxonomyTermDto implements AdminTaxonomyInput {
  @ApiProperty({ example: 'Sliding Window' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_TERM_NAME_LENGTH)
  name!: string;
}

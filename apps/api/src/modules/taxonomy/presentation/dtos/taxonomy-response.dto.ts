import { ApiProperty } from '@nestjs/swagger';
import { CompanyDto, TopicDto } from '@elevatesde/shared-types';

export class TaxonomyTermResponseDto implements TopicDto {
  @ApiProperty({ example: 'uuid-topic' })
  id!: string;

  @ApiProperty({ example: 'sliding-window' })
  slug!: string;

  @ApiProperty({ example: 'Sliding Window' })
  name!: string;

  @ApiProperty({ example: 12 })
  problemCount!: number;
}

export class CompanyResponseDto extends TaxonomyTermResponseDto implements CompanyDto {
  @ApiProperty({ example: 4 })
  solvedCount!: number;
}

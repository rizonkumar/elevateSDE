import { ApiProperty } from '@nestjs/swagger';
import { CompanyRefDto, TopicRefDto } from '@elevatesde/shared-types';

export class TopicRefResponseDto implements TopicRefDto {
  @ApiProperty({ example: 'uuid-topic' })
  id!: string;

  @ApiProperty({ example: 'sliding-window' })
  slug!: string;

  @ApiProperty({ example: 'Sliding Window' })
  name!: string;
}

export class CompanyRefResponseDto implements CompanyRefDto {
  @ApiProperty({ example: 'uuid-company' })
  id!: string;

  @ApiProperty({ example: 'amazon' })
  slug!: string;

  @ApiProperty({ example: 'Amazon' })
  name!: string;

  @ApiProperty({ example: 80, minimum: 1, maximum: 100 })
  frequency!: number;
}

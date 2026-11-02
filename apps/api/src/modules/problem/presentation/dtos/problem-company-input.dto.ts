import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';
import { AdminProblemCompanyInput } from '@elevatesde/shared-types';
import {
  MAX_COMPANY_FREQUENCY,
  MIN_COMPANY_FREQUENCY,
} from '../../domain/policies/taxonomy-limits';

export class ProblemCompanyInputDto implements AdminProblemCompanyInput {
  @ApiProperty({ example: 'uuid-company' })
  @IsUUID()
  companyId!: string;

  @ApiProperty({ example: 80, minimum: MIN_COMPANY_FREQUENCY, maximum: MAX_COMPANY_FREQUENCY })
  @IsInt()
  @Min(MIN_COMPANY_FREQUENCY)
  @Max(MAX_COMPANY_FREQUENCY)
  frequency!: number;
}

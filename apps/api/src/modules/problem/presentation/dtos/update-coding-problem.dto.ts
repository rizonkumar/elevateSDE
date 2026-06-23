import { PartialType } from '@nestjs/swagger';
import { CreateCodingProblemDto } from './create-coding-problem.dto';

export class UpdateCodingProblemDto extends PartialType(CreateCodingProblemDto) {}

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';
import { CreateDailyChallengeDto as ICreateDailyChallengeDto } from '@elevatesde/shared-types';

export class CreateDailyChallengeDto implements ICreateDailyChallengeDto {
  @ApiProperty({ example: '2026-06-25' })
  @IsDateString()
  challengeDate!: string;

  @ApiProperty({ example: 'uuid-string' })
  @IsUUID()
  problemId!: string;
}

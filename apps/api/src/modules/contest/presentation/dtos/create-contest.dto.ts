import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MinLength } from 'class-validator';
import { AdminContestInput } from '@elevatesde/shared-types';

export class CreateContestDto implements AdminContestInput {
  @ApiProperty({ example: 'Weekly Sprint #12' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 'weekly-sprint-12' })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiProperty({ example: 'A one-hour speed round over three array problems.' })
  @IsString()
  description!: string;

  @ApiProperty({ example: '2026-07-10T18:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-07-10T19:30:00.000Z' })
  @IsDateString()
  endsAt!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { GrantBadgeDto as IGrantBadgeDto } from '@elevatesde/shared-types';

export class GrantBadgeDto implements IGrantBadgeDto {
  @ApiProperty({ example: 'uuid-string' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'uuid-string' })
  @IsUUID()
  badgeId!: string;
}

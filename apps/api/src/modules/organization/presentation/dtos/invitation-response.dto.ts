import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';
import { InvitationDto, InviteCreatedDto } from '@elevatesde/shared-types';

export class InvitationResponseDto implements InvitationDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'teammate@company.com' })
  email!: string;

  @ApiProperty({ enum: InvitationStatus })
  status!: InvitationStatus;

  @ApiProperty({ example: '2026-06-24T08:11:29.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-01T08:11:29.000Z' })
  expiresAt!: string;
}

export class InviteCreatedResponseDto extends InvitationResponseDto implements InviteCreatedDto {
  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  token!: string;

  @ApiProperty({ example: 'http://localhost:3001/invite/a1b2c3d4e5f6' })
  inviteUrl!: string;
}

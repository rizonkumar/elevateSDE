import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';
import { InvitePreviewDto } from '@elevatesde/shared-types';

export class InvitePreviewResponseDto implements InvitePreviewDto {
  @ApiProperty({ example: 'Acme Corp' })
  tenantName!: string;

  @ApiProperty({ example: 'teammate@company.com' })
  email!: string;

  @ApiProperty({ enum: InvitationStatus })
  status!: InvitationStatus;

  @ApiProperty({ example: true })
  valid!: boolean;
}

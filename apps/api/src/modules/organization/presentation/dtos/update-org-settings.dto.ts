import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { UpdateOrgSettingsRequest } from '@elevatesde/shared-types';

export class UpdateOrgSettingsDto implements UpdateOrgSettingsRequest {
  @ApiProperty({ example: true })
  @IsBoolean()
  allowPublicProfiles!: boolean;
}

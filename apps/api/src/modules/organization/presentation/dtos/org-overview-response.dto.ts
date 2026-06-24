import { ApiProperty } from '@nestjs/swagger';
import {
  OrgCompanyDto,
  OrgMemberDto,
  OrgMemberStatus,
  OrgOverviewDto,
  OrgPerformancePointDto,
  SeatUsageDto,
} from '@elevatesde/shared-types';
import { InvitationResponseDto } from './invitation-response.dto';

export class OrgCompanyResponseDto implements OrgCompanyDto {
  @ApiProperty({ example: 'Acme Corp' })
  name!: string;

  @ApiProperty({ example: 'TEAM' })
  plan!: string;
}

export class SeatUsageResponseDto implements SeatUsageDto {
  @ApiProperty({ example: 12 })
  used!: number;

  @ApiProperty({ example: 20 })
  total!: number;
}

export class OrgMemberResponseDto implements OrgMemberDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'maya.patel@acme.dev' })
  email!: string;

  @ApiProperty({ example: 'active', enum: ['active', 'invited'] })
  status!: OrgMemberStatus;

  @ApiProperty({ example: 88 })
  avgScore!: number;
}

export class OrgPerformancePointResponseDto implements OrgPerformancePointDto {
  @ApiProperty({ example: 'Maya' })
  label!: string;

  @ApiProperty({ example: 88 })
  score!: number;
}

export class OrgOverviewResponseDto implements OrgOverviewDto {
  @ApiProperty({ type: OrgCompanyResponseDto })
  company!: OrgCompanyResponseDto;

  @ApiProperty({ type: SeatUsageResponseDto })
  seats!: SeatUsageResponseDto;

  @ApiProperty({ type: [OrgMemberResponseDto] })
  members!: OrgMemberResponseDto[];

  @ApiProperty({ type: [OrgPerformancePointResponseDto] })
  teamPerformance!: OrgPerformancePointResponseDto[];

  @ApiProperty({ type: [InvitationResponseDto] })
  invitations!: InvitationResponseDto[];
}

import { Invitation } from '../../domain/entities/invitation';
import { InvitePreviewView, OrgOverviewView } from '../../application/organization.service';
import {
  InvitationResponseDto,
  InviteCreatedResponseDto,
} from '../dtos/invitation-response.dto';
import {
  OrgCompanyResponseDto,
  OrgMemberResponseDto,
  OrgOverviewResponseDto,
  OrgPerformancePointResponseDto,
  SeatUsageResponseDto,
} from '../dtos/org-overview-response.dto';
import { InvitePreviewResponseDto } from '../dtos/invite-preview-response.dto';

export class OrganizationPresentationMapper {
  static toOverview(view: OrgOverviewView): OrgOverviewResponseDto {
    const company = new OrgCompanyResponseDto();
    company.name = view.company.name;
    company.plan = view.company.plan;

    const seats = new SeatUsageResponseDto();
    seats.used = view.seats.used;
    seats.total = view.seats.total;

    const dto = new OrgOverviewResponseDto();
    dto.company = company;
    dto.seats = seats;
    dto.members = view.members.map((member) => {
      const memberDto = new OrgMemberResponseDto();
      memberDto.id = member.id;
      memberDto.email = member.email;
      memberDto.status = member.status;
      memberDto.avgScore = member.avgScore;
      return memberDto;
    });
    dto.teamPerformance = view.teamPerformance.map((point) => {
      const pointDto = new OrgPerformancePointResponseDto();
      pointDto.label = point.label;
      pointDto.score = point.score;
      return pointDto;
    });
    dto.invitations = view.invitations.map((invitation) =>
      OrganizationPresentationMapper.toInvitation(invitation),
    );
    return dto;
  }

  static toInvitation(invitation: Invitation): InvitationResponseDto {
    const dto = new InvitationResponseDto();
    dto.id = invitation.getId();
    dto.email = invitation.getEmail();
    dto.status = invitation.getStatus();
    dto.createdAt = invitation.getCreatedAt().toISOString();
    dto.expiresAt = invitation.getExpiresAt().toISOString();
    return dto;
  }

  static toInviteCreated(invitation: Invitation): InviteCreatedResponseDto {
    const dto = new InviteCreatedResponseDto();
    dto.id = invitation.getId();
    dto.email = invitation.getEmail();
    dto.status = invitation.getStatus();
    dto.createdAt = invitation.getCreatedAt().toISOString();
    dto.expiresAt = invitation.getExpiresAt().toISOString();
    dto.token = invitation.getToken();
    dto.inviteUrl = buildInviteUrl(invitation.getToken());
    return dto;
  }

  static toPreview(view: InvitePreviewView): InvitePreviewResponseDto {
    const dto = new InvitePreviewResponseDto();
    dto.tenantName = view.tenantName;
    dto.email = view.email;
    dto.status = view.status;
    dto.valid = view.valid;
    return dto;
  }
}

function buildInviteUrl(token: string): string {
  const base = process.env.WEB_APP_URL ?? 'http://localhost:3001';
  return `${base.replace(/\/$/, '')}/invite/${token}`;
}

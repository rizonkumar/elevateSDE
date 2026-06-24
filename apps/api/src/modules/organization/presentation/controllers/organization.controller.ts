import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { User } from '../../../users/domain/entities/user';
import { OrganizationService } from '../../application/organization.service';
import { InviteMemberDto } from '../dtos/invite-member.dto';
import { OrgOverviewResponseDto } from '../dtos/org-overview-response.dto';
import {
  InvitationResponseDto,
  InviteCreatedResponseDto,
} from '../dtos/invitation-response.dto';
import { InvitePreviewResponseDto } from '../dtos/invite-preview-response.dto';
import { OrganizationPresentationMapper } from '../mappers/organization-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Organization')
@Controller({ path: 'org', version: '1' })
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('overview')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Get the organization seat usage, members and invitations' })
  @ApiResponse({ status: 200, type: OrgOverviewResponseDto })
  async overview(@Req() req: RequestWithUser): Promise<OrgOverviewResponseDto> {
    const tenantId = this.requireTenant(req.user);
    const view = await this.organizationService.getOverview(tenantId);
    return OrganizationPresentationMapper.toOverview(view);
  }

  @Post('invitations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Create a token-link invitation for a new member' })
  @ApiResponse({ status: 201, type: InviteCreatedResponseDto })
  @ApiResponse({ status: 409, description: 'Seat limit reached or duplicate invitation.' })
  async invite(
    @Body() dto: InviteMemberDto,
    @Req() req: RequestWithUser,
  ): Promise<InviteCreatedResponseDto> {
    const tenantId = this.requireTenant(req.user);
    const invitation = await this.organizationService.invite(
      tenantId,
      req.user.getId(),
      dto.email,
    );
    return OrganizationPresentationMapper.toInviteCreated(invitation);
  }

  @Delete('invitations/:id')
  @HttpCode(204)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  @ApiResponse({ status: 204, description: 'Invitation revoked.' })
  @ApiResponse({ status: 404, description: 'Invitation not found.' })
  async revoke(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    const tenantId = this.requireTenant(req.user);
    await this.organizationService.revoke(tenantId, id);
  }

  @Get('invitations/preview/:token')
  @ApiOperation({ summary: 'Public preview of an invitation by token' })
  @ApiResponse({ status: 200, type: InvitePreviewResponseDto })
  @ApiResponse({ status: 404, description: 'Invitation not found.' })
  async preview(@Param('token') token: string): Promise<InvitePreviewResponseDto> {
    const view = await this.organizationService.preview(token);
    return OrganizationPresentationMapper.toPreview(view);
  }

  @Post('invitations/accept/:token')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Accept an invitation and join the organization' })
  @ApiResponse({ status: 201, type: InvitationResponseDto })
  @ApiResponse({ status: 403, description: 'Invitation issued to a different email.' })
  @ApiResponse({ status: 409, description: 'Invitation expired or no longer active.' })
  async accept(
    @Param('token') token: string,
    @Req() req: RequestWithUser,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.organizationService.accept(token, {
      id: req.user.getId(),
      email: req.user.getEmail(),
    });
    return OrganizationPresentationMapper.toInvitation(invitation);
  }

  private requireTenant(user: User): string {
    const tenantId = user.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('You are not associated with an organization.');
    }
    return tenantId;
  }
}

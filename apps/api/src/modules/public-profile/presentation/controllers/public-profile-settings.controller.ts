import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicProfileSettingsDto } from '@elevatesde/shared-types';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { PublicProfileSettingsService } from '../../application/public-profile-settings.service';
import { HandleAvailabilityQueryDto } from '../dtos/handle-availability-query.dto';
import {
  HandleAvailabilityResponseDto,
  PublicProfileSettingsResponseDto,
} from '../dtos/public-profile-settings-response.dto';
import { UpdatePublicProfileDto } from '../dtos/update-public-profile.dto';
import { PublicProfilePresentationMapper } from '../mappers/public-profile-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Public Profiles')
@ApiBearerAuth()
@Controller({ path: 'users/me', version: '1' })
@UseGuards(JwtAuthGuard)
export class PublicProfileSettingsController {
  constructor(private readonly settingsService: PublicProfileSettingsService) {}

  @Get('public-profile')
  @ApiOperation({ summary: 'Get the current user public profile settings' })
  @ApiResponse({ status: 200, type: PublicProfileSettingsResponseDto })
  async getSettings(@Req() req: RequestWithUser): Promise<PublicProfileSettingsDto> {
    const view = await this.settingsService.getSettings(req.user.getId());
    return PublicProfilePresentationMapper.toSettings(view);
  }

  @Patch('public-profile')
  @ApiOperation({ summary: 'Update handle, bio, links and visibility of the public profile' })
  @ApiResponse({ status: 200, type: PublicProfileSettingsResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid handle, link or visibility change.' })
  @ApiResponse({ status: 409, description: 'Handle already taken.' })
  async update(
    @Body() dto: UpdatePublicProfileDto,
    @Req() req: RequestWithUser,
  ): Promise<PublicProfileSettingsDto> {
    const view = await this.settingsService.update(req.user.getId(), dto);
    return PublicProfilePresentationMapper.toSettings(view);
  }

  @Get('handle-availability')
  @ApiOperation({ summary: 'Check whether a handle can be claimed' })
  @ApiResponse({ status: 200, type: HandleAvailabilityResponseDto })
  async availability(
    @Query() query: HandleAvailabilityQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<HandleAvailabilityResponseDto> {
    const view = await this.settingsService.checkAvailability(req.user.getId(), query.handle);
    return PublicProfilePresentationMapper.toAvailability(view);
  }
}

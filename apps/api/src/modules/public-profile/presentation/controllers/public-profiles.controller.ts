import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PublicProfileDto } from '@elevatesde/shared-types';
import { PublicProfileRateLimit } from '../../../../infrastructure/security/rate-limits';
import { PublicProfileService } from '../../application/public-profile.service';
import { PublicProfileResponseDto } from '../dtos/public-profile-response.dto';
import { PublicProfilePresentationMapper } from '../mappers/public-profile-presentation.mapper';

const PUBLIC_CACHE = 'public, max-age=60';
const NO_STORE = 'no-store';

@ApiTags('Public Profiles')
@Controller({ path: 'public/profiles', version: '1' })
export class PublicProfilesController {
  constructor(private readonly publicProfileService: PublicProfileService) {}

  @Get(':handle')
  @PublicProfileRateLimit()
  @ApiOperation({ summary: 'Get a public profile by handle' })
  @ApiResponse({ status: 200, type: PublicProfileResponseDto })
  @ApiResponse({ status: 404, description: 'Profile not found or not public.' })
  async getByHandle(
    @Param('handle') handle: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicProfileDto> {
    response.setHeader('Cache-Control', NO_STORE);
    const view = await this.publicProfileService.getByHandle(handle);
    response.setHeader('Cache-Control', PUBLIC_CACHE);
    return PublicProfilePresentationMapper.toProfile(view);
  }
}

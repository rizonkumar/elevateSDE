import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicProfileDto } from '@elevatesde/shared-types';
import { PublicProfileRateLimit } from '../../../../infrastructure/security/rate-limits';
import { PublicProfileService } from '../../application/public-profile.service';
import { PublicProfileResponseDto } from '../dtos/public-profile-response.dto';
import { PublicProfilePresentationMapper } from '../mappers/public-profile-presentation.mapper';

@ApiTags('Public Profiles')
@Controller({ path: 'public/profiles', version: '1' })
export class PublicProfilesController {
  constructor(private readonly publicProfileService: PublicProfileService) {}

  @Get(':handle')
  @PublicProfileRateLimit()
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Get a public profile by handle' })
  @ApiResponse({ status: 200, type: PublicProfileResponseDto })
  @ApiResponse({ status: 404, description: 'Profile not found or not public.' })
  async getByHandle(@Param('handle') handle: string): Promise<PublicProfileDto> {
    const view = await this.publicProfileService.getByHandle(handle);
    return PublicProfilePresentationMapper.toProfile(view);
  }
}

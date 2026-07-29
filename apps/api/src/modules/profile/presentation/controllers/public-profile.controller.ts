import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfileService } from '../../application/profile.service';
import { PublicProfileResponseDto } from '../dtos/public-profile-response.dto';
import { ProfilePresentationMapper } from '../mappers/profile-presentation.mapper';

@ApiTags('Public Profiles')
@Controller({ path: 'public/profiles', version: '1' })
export class PublicProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':handle')
  @ApiOperation({ summary: 'Get a public candidate profile by handle' })
  @ApiResponse({ status: 200, type: PublicProfileResponseDto })
  @ApiResponse({ status: 404, description: 'Not found or not public.' })
  async getByHandle(@Param('handle') handle: string): Promise<PublicProfileResponseDto> {
    const profile = await this.profileService.getPublicProfile(handle);
    return ProfilePresentationMapper.toResponse(profile);
  }
}

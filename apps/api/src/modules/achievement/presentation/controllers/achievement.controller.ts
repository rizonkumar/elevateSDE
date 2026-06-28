import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { AchievementService } from '../../application/achievement.service';
import { AchievementsViewResponseDto } from '../dtos/achievements-view-response.dto';
import { AchievementPresentationMapper } from '../mappers/achievement-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Achievements')
@ApiBearerAuth()
@Controller({ path: 'achievements', version: '1' })
@UseGuards(JwtAuthGuard)
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user earned and locked badges with progress' })
  @ApiResponse({ status: 200, type: AchievementsViewResponseDto })
  async list(@Req() req: RequestWithUser): Promise<AchievementsViewResponseDto> {
    const view = await this.achievementService.listForUser(req.user.getId());
    return AchievementPresentationMapper.toAchievements(view);
  }
}

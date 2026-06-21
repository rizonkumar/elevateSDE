import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { User } from '../../../users/domain/entities/user';
import { LeaderboardService } from '../../application/leaderboard.service';
import { AdjustLeaderboardDto } from '../dtos/adjust-leaderboard.dto';
import { LeaderboardEntryResponseDto } from '../dtos/leaderboard-entry-response.dto';
import { LeaderboardPresentationMapper } from '../mappers/leaderboard-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Leaderboard Management')
@ApiBearerAuth()
@Controller({ path: 'admin/leaderboard', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class LeaderboardManagementController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'List all-time leaderboard standings for management' })
  @ApiResponse({ status: 200, type: [LeaderboardEntryResponseDto] })
  async listStandings(@Req() req: RequestWithUser): Promise<LeaderboardEntryResponseDto[]> {
    const standings = await this.leaderboardService.getStandings('all-time', req.user.getId());
    return standings.map((entry) => LeaderboardPresentationMapper.toResponse(entry));
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Adjust a member points and badges' })
  @ApiResponse({ status: 200, type: [LeaderboardEntryResponseDto] })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async adjust(
    @Param('userId') userId: string,
    @Body() dto: AdjustLeaderboardDto,
    @Req() req: RequestWithUser,
  ): Promise<LeaderboardEntryResponseDto[]> {
    const standings = await this.leaderboardService.adjustPoints(
      req.user.getId(),
      userId,
      dto.points,
      dto.badges,
    );
    return standings.map((entry) => LeaderboardPresentationMapper.toResponse(entry));
  }
}

import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { LeaderboardService } from '../../application/leaderboard.service';
import { LeaderboardQueryDto } from '../dtos/leaderboard-query.dto';
import { LeaderboardEntryResponseDto } from '../dtos/leaderboard-entry-response.dto';
import { LeaderboardPresentationMapper } from '../mappers/leaderboard-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Leaderboard')
@ApiBearerAuth()
@Controller({ path: 'leaderboard', version: '1' })
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({
    summary: "Get ranked standings for a timeframe within the viewer's organization",
  })
  @ApiResponse({ status: 200, type: [LeaderboardEntryResponseDto] })
  async getStandings(
    @Query() query: LeaderboardQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<LeaderboardEntryResponseDto[]> {
    const standings = await this.leaderboardService.getStandingsFor(
      req.user,
      query.timeframe ?? 'all-time',
    );
    return standings.map((entry) => LeaderboardPresentationMapper.toResponse(entry));
  }
}

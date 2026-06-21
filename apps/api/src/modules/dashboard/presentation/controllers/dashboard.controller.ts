import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { DashboardService } from '../../application/dashboard.service';
import { DashboardStatsResponseDto } from '../dtos/dashboard-stats-response.dto';
import { DashboardPresentationMapper } from '../mappers/dashboard-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller({ path: 'users/me/dashboard-stats', version: '1' })
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get aggregated dashboard statistics for the current user' })
  @ApiResponse({ status: 200, type: DashboardStatsResponseDto })
  async getStats(@Req() req: RequestWithUser): Promise<DashboardStatsResponseDto> {
    const view = await this.dashboardService.getStats(req.user.getId());
    return DashboardPresentationMapper.toResponse(view);
  }
}

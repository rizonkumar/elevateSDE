import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { DashboardService } from '../../application/dashboard.service';

interface RequestWithUser {
  user: User;
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller({ path: 'users/me/solved-problem-ids', version: '1' })
@UseGuards(JwtAuthGuard)
export class SolvedProblemsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'List problem ids the current user has solved (accepted submission)' })
  @ApiResponse({ status: 200, type: [String] })
  async getSolvedProblemIds(@Req() req: RequestWithUser): Promise<string[]> {
    return this.dashboardService.getSolvedProblemIds(req.user.getId());
  }
}

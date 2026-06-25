import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { DashboardService } from '../../application/dashboard.service';
import { HeatmapQueryDto } from '../dtos/heatmap-query.dto';
import {
  SubmissionHeatmapCellResponseDto,
  SubmissionHeatmapResponseDto,
} from '../dtos/submission-heatmap-response.dto';

interface RequestWithUser {
  user: User;
}

const DEFAULT_WINDOW_DAYS = 365;
const DAY_MS = 86_400_000;

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller({ path: 'users/me/submission-heatmap', version: '1' })
@UseGuards(JwtAuthGuard)
export class SubmissionHeatmapController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user submission counts per day for a date range' })
  @ApiResponse({ status: 200, type: SubmissionHeatmapResponseDto })
  async getHeatmap(
    @Query() query: HeatmapQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<SubmissionHeatmapResponseDto> {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : new Date(to.getTime() - DEFAULT_WINDOW_DAYS * DAY_MS);
    const cells = await this.dashboardService.getSubmissionHeatmap(req.user.getId(), from, to);
    const response = new SubmissionHeatmapResponseDto();
    response.cells = cells.map((cell) => {
      const cellDto = new SubmissionHeatmapCellResponseDto();
      cellDto.date = cell.date;
      cellDto.count = cell.count;
      return cellDto;
    });
    return response;
  }
}

import { Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { User } from '../../../users/domain/entities/user';
import { SchedulerService } from '../../application/scheduler.service';
import { RunScheduledJobParamsDto } from '../dtos/run-scheduled-job-params.dto';
import { ScheduledJobResponseDto } from '../dtos/scheduled-job-response.dto';

interface RequestWithUser {
  user: User;
}

@ApiTags('Scheduler Management')
@ApiBearerAuth()
@Controller({ path: 'admin/scheduler', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SchedulerManagementController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'List recurring background jobs and their UTC schedules' })
  @ApiResponse({ status: 200, type: [ScheduledJobResponseDto] })
  listJobs(): ScheduledJobResponseDto[] {
    return this.schedulerService.listJobs();
  }

  @Post('jobs/:job/run')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue an immediate one-off run of a recurring job' })
  @ApiResponse({ status: 202, type: ScheduledJobResponseDto })
  @ApiResponse({ status: 400, description: 'Unknown job.' })
  async run(
    @Param() params: RunScheduledJobParamsDto,
    @Req() req: RequestWithUser,
  ): Promise<ScheduledJobResponseDto> {
    return this.schedulerService.trigger(params.job, req.user.getId());
  }
}

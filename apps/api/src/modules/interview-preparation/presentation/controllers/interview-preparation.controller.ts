import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  InterviewLoopTemplateDto,
  InterviewPreparationOverviewDto,
  InterviewPreparationPlanDto,
  PreparationTaskDto,
  ReadinessSnapshotDto,
} from '@elevatesde/shared-types';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { InterviewPreparationService } from '../../application/interview-preparation.service';
import {
  CreateInterviewPreparationPlanRequestDto,
  CreatePreparationTaskRequestDto,
  UpdateInterviewPreparationPlanRequestDto,
  UpdatePreparationTaskRequestDto,
  VersionRequestDto,
} from '../dtos/interview-preparation.dto';

interface RequestWithUser {
  user: User;
}

@ApiTags('Interview Preparation')
@ApiBearerAuth()
@Controller({ path: 'interview-preparation', version: '1' })
@UseGuards(JwtAuthGuard)
export class InterviewPreparationController {
  constructor(private readonly service: InterviewPreparationService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List editable interview loop templates' })
  getTemplates(): InterviewLoopTemplateDto[] {
    return this.service.getTemplates();
  }

  @Get('overview')
  @ApiOperation({ summary: 'List preparation plans and applications without plans' })
  getOverview(@Req() req: RequestWithUser): Promise<InterviewPreparationOverviewDto> {
    return this.service.getOverview(req.user.getId());
  }

  @Post('plans/preview')
  @ApiOperation({ summary: 'Validate and preview a preparation plan' })
  preview(
    @Req() req: RequestWithUser,
    @Body() dto: CreateInterviewPreparationPlanRequestDto,
  ): Promise<CreateInterviewPreparationPlanRequestDto> {
    return this.service.preview(req.user.getId(), dto);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a preparation plan' })
  create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateInterviewPreparationPlanRequestDto,
  ): Promise<InterviewPreparationPlanDto> {
    return this.service.create(req.user.getId(), dto);
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Get an owned preparation plan' })
  getPlan(
    @Req() req: RequestWithUser,
    @Param('planId', ParseUUIDPipe) planId: string,
  ): Promise<InterviewPreparationPlanDto> {
    return this.service.getPlan(req.user.getId(), planId);
  }

  @Patch('plans/:planId')
  @ApiOperation({ summary: 'Update a preparation plan' })
  updatePlan(
    @Req() req: RequestWithUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: UpdateInterviewPreparationPlanRequestDto,
  ): Promise<InterviewPreparationPlanDto> {
    return this.service.updatePlan(req.user.getId(), planId, dto);
  }

  @Post('plans/:planId/archive')
  @ApiOperation({ summary: 'Archive a preparation plan' })
  archivePlan(
    @Req() req: RequestWithUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: VersionRequestDto,
  ): Promise<InterviewPreparationPlanDto> {
    return this.service.archivePlan(req.user.getId(), planId, dto.version);
  }

  @Post('plans/:planId/tasks')
  @ApiOperation({ summary: 'Add a preparation task' })
  createTask(
    @Req() req: RequestWithUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreatePreparationTaskRequestDto,
  ): Promise<PreparationTaskDto> {
    return this.service.createTask(req.user.getId(), planId, dto);
  }

  @Patch('tasks/:taskId')
  @ApiOperation({ summary: 'Update a preparation task' })
  updateTask(
    @Req() req: RequestWithUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdatePreparationTaskRequestDto,
  ): Promise<PreparationTaskDto> {
    return this.service.updateTask(req.user.getId(), taskId, dto);
  }

  @Post('tasks/:taskId/complete')
  @ApiOperation({ summary: 'Complete a preparation task' })
  completeTask(
    @Req() req: RequestWithUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: VersionRequestDto,
  ): Promise<PreparationTaskDto> {
    return this.service.setTaskCompletion(req.user.getId(), taskId, true, dto.version);
  }

  @Post('tasks/:taskId/reopen')
  @ApiOperation({ summary: 'Reopen a preparation task' })
  reopenTask(
    @Req() req: RequestWithUser,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: VersionRequestDto,
  ): Promise<PreparationTaskDto> {
    return this.service.setTaskCompletion(req.user.getId(), taskId, false, dto.version);
  }

  @Post('plans/:planId/readiness-snapshots')
  @ApiOperation({ summary: 'Refresh deterministic readiness evidence' })
  refreshSnapshot(
    @Req() req: RequestWithUser,
    @Param('planId', ParseUUIDPipe) planId: string,
  ): Promise<ReadinessSnapshotDto> {
    return this.service.refreshSnapshot(req.user.getId(), planId);
  }
}

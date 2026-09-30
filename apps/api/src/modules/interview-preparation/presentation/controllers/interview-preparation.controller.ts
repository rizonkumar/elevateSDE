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
  PeerPracticeSessionDto,
  PeerScorecardDto,
  PreparationRoundDto,
  PreparationTaskDto,
  ReadinessSnapshotDto,
} from '@elevatesde/shared-types';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { InterviewPreparationService } from '../../application/interview-preparation.service';
import { PeerPracticeService } from '../../application/peer-practice.service';
import {
  CreateInterviewPreparationPlanRequestDto,
  CreatePeerPracticeSessionRequestDto,
  CreatePreparationRoundRequestDto,
  CreatePreparationTaskRequestDto,
  UpdateInterviewPreparationPlanRequestDto,
  UpdatePreparationRoundRequestDto,
  ReschedulePeerPracticeSessionRequestDto,
  SubmitPeerScorecardRequestDto,
  UpdatePeerPracticeStatusRequestDto,
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
  constructor(
    private readonly service: InterviewPreparationService,
    private readonly peerPracticeService: PeerPracticeService,
  ) {}

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

  @Post('plans/:planId/rounds')
  @ApiOperation({ summary: 'Add an interview round' })
  createRound(
    @Req() req: RequestWithUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreatePreparationRoundRequestDto,
  ): Promise<PreparationRoundDto> {
    return this.service.createRound(req.user.getId(), planId, dto);
  }

  @Patch('rounds/:roundId')
  @ApiOperation({ summary: 'Update an interview round' })
  updateRound(
    @Req() req: RequestWithUser,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Body() dto: UpdatePreparationRoundRequestDto,
  ): Promise<PreparationRoundDto> {
    return this.service.updateRound(req.user.getId(), roundId, dto);
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

  @Post('plans/:planId/peer-sessions')
  @ApiOperation({ summary: 'Invite a candidate to peer practice' })
  createPeerSession(
    @Req() req: RequestWithUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreatePeerPracticeSessionRequestDto,
  ): Promise<PeerPracticeSessionDto> {
    return this.peerPracticeService.create(req.user.getId(), planId, dto);
  }

  @Get('peer-sessions/:sessionId')
  @ApiOperation({ summary: 'Get a participant-owned peer practice session' })
  getPeerSession(
    @Req() req: RequestWithUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<PeerPracticeSessionDto> {
    return this.peerPracticeService.get(req.user.getId(), sessionId);
  }

  @Patch('peer-sessions/:sessionId/status')
  @ApiOperation({ summary: 'Update a peer practice session status' })
  updatePeerSessionStatus(
    @Req() req: RequestWithUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: UpdatePeerPracticeStatusRequestDto,
  ): Promise<PeerPracticeSessionDto> {
    return this.peerPracticeService.updateStatus(req.user.getId(), sessionId, dto.status, dto.version);
  }

  @Patch('peer-sessions/:sessionId/reschedule')
  @ApiOperation({ summary: 'Reschedule a peer practice session' })
  reschedulePeerSession(
    @Req() req: RequestWithUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: ReschedulePeerPracticeSessionRequestDto,
  ): Promise<PeerPracticeSessionDto> {
    return this.peerPracticeService.reschedule(req.user.getId(), sessionId, dto);
  }

  @Post('peer-sessions/:sessionId/scorecards')
  @ApiOperation({ summary: 'Submit peer practice feedback' })
  submitPeerScorecard(
    @Req() req: RequestWithUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SubmitPeerScorecardRequestDto,
  ): Promise<PeerScorecardDto> {
    return this.peerPracticeService.submitScorecard(req.user.getId(), sessionId, dto);
  }
}

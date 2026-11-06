import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type {
  StudyGroupActivityItemDto,
  StudyGroupDetailDto,
  StudyGroupLeaderboardDto,
  StudyGroupListDto,
  StudyGroupRosterCandidateDto,
} from '@elevatesde/shared-types';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { buildDisplayName } from '../../../../common/display-name';
import { StudyGroupService } from '../../application/study-group.service';
import { StudyGroupActor } from '../../domain/policies/study-group-access';
import { GoalWriteInput } from '../../domain/read-models/study-group-records';
import {
  AddStudyGroupMembersDto,
  CreateStudyGroupDto,
  RosterCandidatesQueryDto,
  StudyGroupGoalDto,
  StudyGroupLeaderboardQueryDto,
  UpdateStudyGroupDto,
  UpdateStudyGroupMemberDto,
} from '../dtos/study-group-request.dto';
import { StudyGroupPresentationMapper } from '../mappers/study-group-presentation.mapper';

interface RequestWithUser {
  user: User;
}

const NOT_FOUND = { status: 404, description: 'Group not found or not visible to you.' };
const NO_ORGANIZATION = { status: 403, description: 'Not allowed, or not in an organization.' };

@ApiTags('Study Groups')
@ApiBearerAuth()
@Controller({ path: 'study-groups', version: '1' })
@UseGuards(JwtAuthGuard)
export class StudyGroupsController {
  constructor(private readonly studyGroupService: StudyGroupService) {}

  @Get()
  @ApiOperation({ summary: 'List my study groups and the groups I can join' })
  @ApiResponse({ status: 200 })
  @ApiResponse(NO_ORGANIZATION)
  async list(@Req() req: RequestWithUser): Promise<StudyGroupListDto> {
    const view = await this.studyGroupService.list(toActor(req.user));
    return StudyGroupPresentationMapper.toList(view);
  }

  @Post()
  @ApiOperation({ summary: 'Create a study group (organization admins only)' })
  @ApiResponse({ status: 201 })
  @ApiResponse(NO_ORGANIZATION)
  @ApiResponse({ status: 409, description: 'A group with this name already exists.' })
  async create(
    @Body() dto: CreateStudyGroupDto,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupDetailDto> {
    const view = await this.studyGroupService.create(toActor(req.user), dto);
    return StudyGroupPresentationMapper.toDetail(view);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a study group with members and goal progress' })
  @ApiResponse({ status: 200 })
  @ApiResponse(NOT_FOUND)
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupDetailDto> {
    const view = await this.studyGroupService.getDetail(toActor(req.user), id);
    return StudyGroupPresentationMapper.toDetail(view);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a study group name, description or join policy' })
  @ApiResponse({ status: 200 })
  @ApiResponse(NOT_FOUND)
  @ApiResponse({ status: 409, description: 'A group with this name already exists.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudyGroupDto,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupDetailDto> {
    const view = await this.studyGroupService.update(toActor(req.user), id, dto);
    return StudyGroupPresentationMapper.toDetail(view);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Archive a study group (organization admins only)' })
  @ApiResponse({ status: 204 })
  @ApiResponse(NOT_FOUND)
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    await this.studyGroupService.archive(toActor(req.user), id);
  }

  @Post(':id/join')
  @HttpCode(200)
  @ApiOperation({ summary: 'Join an open study group' })
  @ApiResponse({ status: 200 })
  @ApiResponse(NOT_FOUND)
  async join(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupDetailDto> {
    const view = await this.studyGroupService.join(toActor(req.user), id);
    return StudyGroupPresentationMapper.toDetail(view);
  }

  @Post(':id/leave')
  @HttpCode(204)
  @ApiOperation({ summary: 'Leave a study group' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 400, description: 'Not a member, or the last owner.' })
  async leave(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser): Promise<void> {
    await this.studyGroupService.leave(toActor(req.user), id);
  }

  @Get(':id/roster-candidates')
  @ApiOperation({ summary: 'Search organization members who are not yet in the group' })
  @ApiResponse({ status: 200 })
  async rosterCandidates(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RosterCandidatesQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupRosterCandidateDto[]> {
    const candidates = await this.studyGroupService.rosterCandidates(
      toActor(req.user),
      id,
      query.q ?? '',
    );
    return candidates.map((candidate) =>
      StudyGroupPresentationMapper.toRosterCandidate(candidate),
    );
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add organization members to the group' })
  @ApiResponse({ status: 201 })
  async addMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddStudyGroupMembersDto,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupDetailDto> {
    const view = await this.studyGroupService.addMembers(toActor(req.user), id, dto.userIds);
    return StudyGroupPresentationMapper.toDetail(view);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Change a member role (organization admins only)' })
  @ApiResponse({ status: 200 })
  async updateMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateStudyGroupMemberDto,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupDetailDto> {
    const view = await this.studyGroupService.updateMemberRole(
      toActor(req.user),
      id,
      userId,
      dto.role,
    );
    return StudyGroupPresentationMapper.toDetail(view);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the group' })
  @ApiResponse({ status: 200 })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupDetailDto> {
    const view = await this.studyGroupService.removeMember(toActor(req.user), id, userId);
    return StudyGroupPresentationMapper.toDetail(view);
  }

  @Post(':id/goals')
  @ApiOperation({ summary: 'Add a shared goal to the group' })
  @ApiResponse({ status: 201 })
  async createGoal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StudyGroupGoalDto,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupDetailDto> {
    const view = await this.studyGroupService.createGoal(toActor(req.user), id, toGoalInput(dto));
    return StudyGroupPresentationMapper.toDetail(view);
  }

  @Patch(':id/goals/:goalId')
  @ApiOperation({ summary: 'Edit a group goal' })
  @ApiResponse({ status: 200 })
  async updateGoal(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() dto: StudyGroupGoalDto,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupDetailDto> {
    const view = await this.studyGroupService.updateGoal(
      toActor(req.user),
      id,
      goalId,
      toGoalInput(dto),
    );
    return StudyGroupPresentationMapper.toDetail(view);
  }

  @Delete(':id/goals/:goalId')
  @ApiOperation({ summary: 'Delete a group goal' })
  @ApiResponse({ status: 200 })
  async deleteGoal(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupDetailDto> {
    const view = await this.studyGroupService.deleteGoal(toActor(req.user), id, goalId);
    return StudyGroupPresentationMapper.toDetail(view);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Rank group members by points over a window' })
  @ApiResponse({ status: 200 })
  async leaderboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: StudyGroupLeaderboardQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupLeaderboardDto> {
    const view = await this.studyGroupService.leaderboard(
      toActor(req.user),
      id,
      query.window ?? 'goal',
    );
    return StudyGroupPresentationMapper.toLeaderboard(view);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Latest activity from group members' })
  @ApiResponse({ status: 200 })
  async activity(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<StudyGroupActivityItemDto[]> {
    const items = await this.studyGroupService.activity(toActor(req.user), id);
    return items.map((item) => StudyGroupPresentationMapper.toActivity(item));
  }
}

function toActor(user: User): StudyGroupActor {
  return {
    userId: user.getId(),
    tenantId: user.getTenantId(),
    isTenantAdmin: user.getRole() === UserRole.TENANT_ADMIN,
    displayName: buildDisplayName(user.getFirstName(), user.getLastName()),
  };
}

function toGoalInput(dto: StudyGroupGoalDto): GoalWriteInput {
  return {
    title: dto.title,
    metric: dto.metric,
    scope: dto.scope,
    target: dto.target,
    startsAt: new Date(dto.startsAt),
    endsAt: new Date(dto.endsAt),
  };
}

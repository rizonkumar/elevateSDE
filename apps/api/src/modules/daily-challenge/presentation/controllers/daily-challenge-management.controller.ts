import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { DailyChallengeService } from '../../application/daily-challenge.service';
import { addDays } from '../../domain/daily-date';
import { CreateDailyChallengeDto } from '../dtos/create-daily-challenge.dto';
import { DailyChallengeScheduleResponseDto } from '../dtos/daily-challenge-schedule-response.dto';
import { ScheduleQueryDto } from '../dtos/schedule-query.dto';
import { DailyChallengePresentationMapper } from '../mappers/daily-challenge-presentation.mapper';

const DEFAULT_RANGE_DAYS = 30;

@ApiTags('Daily Challenge Management')
@ApiBearerAuth()
@Controller({ path: 'admin/daily-challenges', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DailyChallengeManagementController {
  constructor(private readonly dailyChallengeService: DailyChallengeService) {}

  @Get()
  @ApiOperation({ summary: 'List scheduled daily challenges with participation counts' })
  @ApiResponse({ status: 200, type: [DailyChallengeScheduleResponseDto] })
  async list(@Query() query: ScheduleQueryDto): Promise<DailyChallengeScheduleResponseDto[]> {
    const from = query.from ? new Date(query.from) : addDays(new Date(), -DEFAULT_RANGE_DAYS);
    const to = query.to ? new Date(query.to) : addDays(new Date(), DEFAULT_RANGE_DAYS);
    const views = await this.dailyChallengeService.listSchedule(from, to);
    return views.map((view) => DailyChallengePresentationMapper.toSchedule(view));
  }

  @Post()
  @ApiOperation({ summary: 'Schedule a published problem as the daily challenge for a date' })
  @ApiResponse({ status: 201, type: DailyChallengeScheduleResponseDto })
  @ApiResponse({ status: 409, description: 'A challenge is already scheduled for that date.' })
  async create(@Body() dto: CreateDailyChallengeDto): Promise<DailyChallengeScheduleResponseDto> {
    const view = await this.dailyChallengeService.schedule(new Date(dto.challengeDate), dto.problemId);
    return DailyChallengePresentationMapper.toSchedule(view);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a scheduled daily challenge' })
  @ApiResponse({ status: 204, description: 'Removed.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.dailyChallengeService.unschedule(id);
  }
}

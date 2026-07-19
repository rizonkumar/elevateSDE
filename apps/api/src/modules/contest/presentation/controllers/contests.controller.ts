import { Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { ContestParticipationService } from '../../application/contest-participation.service';
import {
  ContestCandidateDetailResponseDto,
  ContestCandidateSummaryResponseDto,
  ContestStandingRowResponseDto,
} from '../dtos/contest-candidate-response.dto';
import { ContestPresentationMapper } from '../mappers/contest-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Contests')
@ApiBearerAuth()
@Controller({ path: 'contests', version: '1' })
@UseGuards(JwtAuthGuard)
export class ContestsController {
  constructor(private readonly participationService: ContestParticipationService) {}

  @Get()
  @ApiOperation({ summary: 'List visible contests with registration state' })
  @ApiResponse({ status: 200, type: [ContestCandidateSummaryResponseDto] })
  async list(@Req() req: RequestWithUser): Promise<ContestCandidateSummaryResponseDto[]> {
    const views = await this.participationService.listForUser(req.user.getId());
    return views.map((view) => ContestPresentationMapper.toCandidateSummary(view));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a contest with problems and per-problem progress' })
  @ApiResponse({ status: 200, type: ContestCandidateDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async detail(
    @Param('slug') slug: string,
    @Req() req: RequestWithUser,
  ): Promise<ContestCandidateDetailResponseDto> {
    const view = await this.participationService.getBySlugForUser(slug, req.user.getId());
    return ContestPresentationMapper.toCandidateDetail(view);
  }

  @Post(':slug/register')
  @HttpCode(200)
  @ApiOperation({ summary: 'Register the current user for a contest' })
  @ApiResponse({ status: 200, description: 'Registered.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async register(@Param('slug') slug: string, @Req() req: RequestWithUser): Promise<void> {
    await this.participationService.register(slug, req.user.getId());
  }

  @Get(':slug/standings')
  @ApiOperation({ summary: 'Get the ranked standings for a contest' })
  @ApiResponse({ status: 200, type: [ContestStandingRowResponseDto] })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async standings(
    @Param('slug') slug: string,
    @Req() req: RequestWithUser,
  ): Promise<ContestStandingRowResponseDto[]> {
    const rows = await this.participationService.standings(slug, req.user.getId());
    return rows.map((row) => ContestPresentationMapper.toStandingRow(row));
  }
}

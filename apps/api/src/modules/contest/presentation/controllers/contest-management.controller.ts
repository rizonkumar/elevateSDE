import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { ContestService } from '../../application/contest.service';
import { CreateContestDto } from '../dtos/create-contest.dto';
import { UpdateContestDto } from '../dtos/update-contest.dto';
import { SetContestProblemsDto } from '../dtos/set-contest-problems.dto';
import { PublishContestDto } from '../dtos/publish-contest.dto';
import { ContestListResponseDto } from '../dtos/contest-list-response.dto';
import { ContestDetailResponseDto } from '../dtos/contest-detail-response.dto';
import { ContestPresentationMapper } from '../mappers/contest-presentation.mapper';

@ApiTags('Contest Management')
@ApiBearerAuth()
@Controller({ path: 'admin/contests', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ContestManagementController {
  constructor(private readonly contestService: ContestService) {}

  @Get()
  @ApiOperation({ summary: 'List contests with problem counts and derived status' })
  @ApiResponse({ status: 200, type: ContestListResponseDto })
  async list(): Promise<ContestListResponseDto> {
    const views = await this.contestService.list();
    const items = views.map((view) => ContestPresentationMapper.toSummary(view));
    return { items, total: items.length };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contest with its attached problems' })
  @ApiResponse({ status: 200, type: ContestDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async detail(@Param('id') id: string): Promise<ContestDetailResponseDto> {
    return ContestPresentationMapper.toDetail(await this.contestService.getDetail(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create a draft contest' })
  @ApiResponse({ status: 201, type: ContestDetailResponseDto })
  @ApiResponse({ status: 409, description: 'Slug already in use.' })
  async create(@Body() dto: CreateContestDto): Promise<ContestDetailResponseDto> {
    const view = await this.contestService.create({
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
    });
    return ContestPresentationMapper.toDetail(view);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contest details and schedule window' })
  @ApiResponse({ status: 200, type: ContestDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  @ApiResponse({ status: 409, description: 'Slug already in use.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContestDto,
  ): Promise<ContestDetailResponseDto> {
    const view = await this.contestService.update(id, {
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
    });
    return ContestPresentationMapper.toDetail(view);
  }

  @Post(':id/problems')
  @ApiOperation({ summary: 'Replace the problems attached to a contest' })
  @ApiResponse({ status: 201, type: ContestDetailResponseDto })
  @ApiResponse({ status: 400, description: 'A problem is missing or not published.' })
  async setProblems(
    @Param('id') id: string,
    @Body() dto: SetContestProblemsDto,
  ): Promise<ContestDetailResponseDto> {
    const view = await this.contestService.setProblems(id, dto.problems);
    return ContestPresentationMapper.toDetail(view);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish a contest' })
  @ApiResponse({ status: 200, type: ContestDetailResponseDto })
  @ApiResponse({ status: 400, description: 'Contest is not ready to publish.' })
  async setPublished(
    @Param('id') id: string,
    @Body() dto: PublishContestDto,
  ): Promise<ContestDetailResponseDto> {
    const view = await this.contestService.setPublished(id, dto.publish);
    return ContestPresentationMapper.toDetail(view);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a contest' })
  @ApiResponse({ status: 204, description: 'Deleted.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.contestService.remove(id);
  }
}

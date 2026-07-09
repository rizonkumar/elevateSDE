import { Controller, HttpCode, Param, Post, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { LearningPathService } from '../../application/learning-path.service';
import {
  LearningPathDetailResponseDto,
  LearningPathResponseDto,
} from '../dtos/learning-path-response.dto';
import { LearningPathPresentationMapper } from '../mappers/learning-path-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Learning Paths')
@ApiBearerAuth()
@Controller({ path: 'learning-paths', version: '1' })
@UseGuards(JwtAuthGuard)
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Get()
  @ApiOperation({ summary: 'List published learning paths with enrollment and progress' })
  @ApiResponse({ status: 200, type: [LearningPathResponseDto] })
  async list(@Req() req: RequestWithUser): Promise<LearningPathResponseDto[]> {
    const views = await this.learningPathService.listPublished(
      req.user.getId(),
      req.user.getTenantId(),
    );
    return views.map((view) => LearningPathPresentationMapper.toCard(view));
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published learning path with modules and per-item progress' })
  @ApiResponse({ status: 200, type: LearningPathDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async detail(
    @Param('slug') slug: string,
    @Req() req: RequestWithUser,
  ): Promise<LearningPathDetailResponseDto> {
    const view = await this.learningPathService.getBySlug(
      slug,
      req.user.getId(),
      req.user.getTenantId(),
    );
    return LearningPathPresentationMapper.toCandidateDetail(view);
  }

  @Post(':id/enroll')
  @HttpCode(200)
  @ApiOperation({ summary: 'Enroll the current user in a learning path' })
  @ApiResponse({ status: 200, description: 'Enrolled.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async enroll(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    await this.learningPathService.enroll(req.user.getId(), id, req.user.getTenantId());
  }
}

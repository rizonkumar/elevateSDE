import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { ProblemSocialService } from '../../application/problem-social.service';
import { CreateProblemDiscussionDto } from '../dtos/create-problem-discussion.dto';
import { UpsertProblemNoteDto } from '../dtos/upsert-problem-note.dto';
import { ProblemDiscussionResponseDto } from '../dtos/problem-discussion-response.dto';
import { BookmarkToggleResponseDto } from '../dtos/bookmark-toggle-response.dto';
import { ProblemNoteResponseDto } from '../dtos/problem-note-response.dto';
import { ProblemSocialPresentationMapper } from '../mappers/problem-social-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Problem Discussions')
@ApiBearerAuth()
@Controller({ path: 'problems', version: '1' })
@UseGuards(JwtAuthGuard)
export class ProblemDiscussionController {
  constructor(private readonly problemSocialService: ProblemSocialService) {}

  @Get(':id/discussions')
  @ApiOperation({ summary: 'List discussions for a problem' })
  @ApiResponse({ status: 200, type: [ProblemDiscussionResponseDto] })
  async listDiscussions(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemDiscussionResponseDto[]> {
    const discussions = await this.problemSocialService.listDiscussions(req.user.getId(), id);
    return discussions.map((discussion) =>
      ProblemSocialPresentationMapper.toDiscussionResponse(discussion),
    );
  }

  @Post(':id/discussions')
  @ApiOperation({ summary: 'Start a discussion on a problem' })
  @ApiResponse({ status: 201, type: ProblemDiscussionResponseDto })
  async createDiscussion(
    @Param('id') id: string,
    @Body() dto: CreateProblemDiscussionDto,
    @Req() req: RequestWithUser,
  ): Promise<ProblemDiscussionResponseDto> {
    const discussion = await this.problemSocialService.createDiscussion(req.user.getId(), id, {
      title: dto.title,
      body: dto.body,
    });
    return ProblemSocialPresentationMapper.toDiscussionResponse(discussion);
  }

  @Post(':id/bookmark')
  @ApiOperation({ summary: 'Toggle a bookmark on a problem' })
  @ApiResponse({ status: 200, type: BookmarkToggleResponseDto })
  async toggleBookmark(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<BookmarkToggleResponseDto> {
    const bookmarked = await this.problemSocialService.toggleBookmark(req.user.getId(), id);
    const dto = new BookmarkToggleResponseDto();
    dto.bookmarked = bookmarked;
    return dto;
  }

  @Get(':id/note')
  @ApiOperation({ summary: 'Get the current user private note for a problem' })
  @ApiResponse({ status: 200, type: ProblemNoteResponseDto })
  @ApiResponse({ status: 404, description: 'No note saved yet.' })
  async getNote(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemNoteResponseDto> {
    const note = await this.problemSocialService.getNote(req.user.getId(), id);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return ProblemSocialPresentationMapper.toNoteResponse(note);
  }

  @Put(':id/note')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create or update the current user private note for a problem' })
  @ApiResponse({ status: 200, type: ProblemNoteResponseDto })
  async upsertNote(
    @Param('id') id: string,
    @Body() dto: UpsertProblemNoteDto,
    @Req() req: RequestWithUser,
  ): Promise<ProblemNoteResponseDto> {
    const note = await this.problemSocialService.upsertNote(req.user.getId(), id, dto.body);
    return ProblemSocialPresentationMapper.toNoteResponse(note);
  }
}

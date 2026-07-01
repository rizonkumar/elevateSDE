import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { ProblemSocialService } from '../../application/problem-social.service';
import { CreateDiscussionCommentDto } from '../dtos/create-discussion-comment.dto';
import { ProblemDiscussionResponseDto } from '../dtos/problem-discussion-response.dto';
import { ProblemDiscussionCommentResponseDto } from '../dtos/problem-discussion-comment-response.dto';
import { ProblemSocialPresentationMapper } from '../mappers/problem-social-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Problem Discussions')
@ApiBearerAuth()
@Controller({ path: 'discussions', version: '1' })
@UseGuards(JwtAuthGuard)
export class DiscussionController {
  constructor(private readonly problemSocialService: ProblemSocialService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a single discussion' })
  @ApiResponse({ status: 200, type: ProblemDiscussionResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async getDiscussion(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemDiscussionResponseDto> {
    const discussion = await this.problemSocialService.getDiscussion(req.user.getId(), id);
    return ProblemSocialPresentationMapper.toDiscussionResponse(discussion);
  }

  @Post(':id/upvote')
  @ApiOperation({ summary: 'Toggle an upvote on a discussion' })
  @ApiResponse({ status: 200, type: ProblemDiscussionResponseDto })
  async toggleUpvote(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemDiscussionResponseDto> {
    const discussion = await this.problemSocialService.toggleDiscussionUpvote(req.user.getId(), id);
    return ProblemSocialPresentationMapper.toDiscussionResponse(discussion);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments on a discussion' })
  @ApiResponse({ status: 200, type: [ProblemDiscussionCommentResponseDto] })
  async listComments(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemDiscussionCommentResponseDto[]> {
    const comments = await this.problemSocialService.listComments(req.user.getId(), id);
    return comments.map((comment) => ProblemSocialPresentationMapper.toCommentResponse(comment));
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a discussion' })
  @ApiResponse({ status: 201, type: ProblemDiscussionCommentResponseDto })
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateDiscussionCommentDto,
    @Req() req: RequestWithUser,
  ): Promise<ProblemDiscussionCommentResponseDto> {
    const comment = await this.problemSocialService.addComment(req.user.getId(), id, dto.body);
    return ProblemSocialPresentationMapper.toCommentResponse(comment);
  }

  @Post('comments/:commentId/upvote')
  @ApiOperation({ summary: 'Toggle an upvote on a discussion comment' })
  @ApiResponse({ status: 200, type: ProblemDiscussionCommentResponseDto })
  async toggleCommentUpvote(
    @Param('commentId') commentId: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemDiscussionCommentResponseDto> {
    const comment = await this.problemSocialService.toggleCommentUpvote(
      req.user.getId(),
      commentId,
    );
    return ProblemSocialPresentationMapper.toCommentResponse(comment);
  }
}

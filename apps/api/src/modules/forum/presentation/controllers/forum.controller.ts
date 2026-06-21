import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { ForumService } from '../../application/forum.service';
import { CreateForumPostDto } from '../dtos/create-forum-post.dto';
import { CreateForumCommentDto } from '../dtos/create-forum-comment.dto';
import { CreateForumReportDto } from '../dtos/create-forum-report.dto';
import { ForumPostResponseDto } from '../dtos/forum-post-response.dto';
import { ForumCommentResponseDto } from '../dtos/forum-comment-response.dto';
import { ForumPresentationMapper } from '../mappers/forum-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Forum')
@ApiBearerAuth()
@Controller({ path: 'forum', version: '1' })
@UseGuards(JwtAuthGuard)
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('posts')
  @ApiOperation({ summary: 'List published forum posts' })
  @ApiResponse({ status: 200, type: [ForumPostResponseDto] })
  async listPosts(@Req() req: RequestWithUser): Promise<ForumPostResponseDto[]> {
    const posts = await this.forumService.listFeed(req.user.getId());
    return posts.map((post) => ForumPresentationMapper.toPostResponse(post));
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a forum post' })
  @ApiResponse({ status: 201, type: ForumPostResponseDto })
  async createPost(
    @Body() dto: CreateForumPostDto,
    @Req() req: RequestWithUser,
  ): Promise<ForumPostResponseDto> {
    const post = await this.forumService.createPost(req.user.getId(), {
      title: dto.title,
      body: dto.body,
      tags: dto.tags,
    });
    return ForumPresentationMapper.toPostResponse(post);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get a forum post and register a view' })
  @ApiResponse({ status: 200, type: ForumPostResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async getPost(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ForumPostResponseDto> {
    const post = await this.forumService.getPost(req.user.getId(), id);
    return ForumPresentationMapper.toPostResponse(post);
  }

  @Post('posts/:id/upvote')
  @ApiOperation({ summary: 'Toggle an upvote on a post' })
  @ApiResponse({ status: 200, type: ForumPostResponseDto })
  async togglePostUpvote(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ForumPostResponseDto> {
    const post = await this.forumService.togglePostUpvote(req.user.getId(), id);
    return ForumPresentationMapper.toPostResponse(post);
  }

  @Post('posts/:id/report')
  @HttpCode(204)
  @ApiOperation({ summary: 'Report a post for moderation' })
  @ApiResponse({ status: 204, description: 'Report recorded.' })
  async reportPost(
    @Param('id') id: string,
    @Body() dto: CreateForumReportDto,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    await this.forumService.reportPost(req.user.getId(), id, dto.reason);
  }

  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'List comments on a post' })
  @ApiResponse({ status: 200, type: [ForumCommentResponseDto] })
  async listComments(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ForumCommentResponseDto[]> {
    const comments = await this.forumService.listComments(req.user.getId(), id);
    return comments.map((comment) => ForumPresentationMapper.toCommentResponse(comment));
  }

  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Add a comment to a post' })
  @ApiResponse({ status: 201, type: ForumCommentResponseDto })
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateForumCommentDto,
    @Req() req: RequestWithUser,
  ): Promise<ForumCommentResponseDto> {
    const comment = await this.forumService.addComment(req.user.getId(), id, dto.body);
    return ForumPresentationMapper.toCommentResponse(comment);
  }

  @Post('comments/:id/upvote')
  @ApiOperation({ summary: 'Toggle an upvote on a comment' })
  @ApiResponse({ status: 200, type: ForumCommentResponseDto })
  async toggleCommentUpvote(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ForumCommentResponseDto> {
    const comment = await this.forumService.toggleCommentUpvote(req.user.getId(), id);
    return ForumPresentationMapper.toCommentResponse(comment);
  }
}

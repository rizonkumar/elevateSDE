import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { User } from '../../../users/domain/entities/user';
import { ForumService } from '../../application/forum.service';
import { UpdatePostStatusDto } from '../dtos/update-post-status.dto';
import { AdminForumPostResponseDto } from '../dtos/admin-forum-post-response.dto';
import { ForumCommentResponseDto } from '../dtos/forum-comment-response.dto';
import { ForumPresentationMapper } from '../mappers/forum-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Forum Moderation')
@ApiBearerAuth()
@Controller({ path: 'admin/forum-posts', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ForumModerationController {
  constructor(private readonly forumService: ForumService) {}

  @Get()
  @ApiOperation({ summary: 'List all forum posts for moderation' })
  @ApiResponse({ status: 200, type: [AdminForumPostResponseDto] })
  async listPosts(@Req() req: RequestWithUser): Promise<AdminForumPostResponseDto[]> {
    const posts = await this.forumService.listAllForAdmin(req.user.getId());
    return posts.map((post) => ForumPresentationMapper.toAdminPostResponse(post));
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments on a post for moderation' })
  @ApiResponse({ status: 200, type: [ForumCommentResponseDto] })
  async listComments(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ForumCommentResponseDto[]> {
    const comments = await this.forumService.listCommentsForAdmin(req.user.getId(), id);
    return comments.map((comment) => ForumPresentationMapper.toCommentResponse(comment));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve, flag, or remove a post' })
  @ApiResponse({ status: 200, type: AdminForumPostResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePostStatusDto,
    @Req() req: RequestWithUser,
  ): Promise<AdminForumPostResponseDto> {
    const post = await this.forumService.updatePostStatus(req.user.getId(), id, dto.status);
    return ForumPresentationMapper.toAdminPostResponse(post);
  }
}

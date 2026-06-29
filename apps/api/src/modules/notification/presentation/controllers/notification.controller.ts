import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { NotificationService } from '../../application/notification.service';
import { NotificationPreferenceResponseDto } from '../dtos/notification-preference-response.dto';
import { NotificationsViewResponseDto } from '../dtos/notifications-view-response.dto';
import { UnreadCountResponseDto } from '../dtos/unread-count-response.dto';
import { UpdateNotificationPreferenceDto } from '../dtos/update-notification-preference.dto';
import { NotificationPresentationMapper } from '../mappers/notification-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user notifications with unread count' })
  @ApiResponse({ status: 200, type: NotificationsViewResponseDto })
  async list(@Req() req: RequestWithUser): Promise<NotificationsViewResponseDto> {
    const view = await this.notificationService.listForUser(req.user.getId());
    return NotificationPresentationMapper.toView(view);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get the current user unread notification count' })
  @ApiResponse({ status: 200, type: UnreadCountResponseDto })
  async unreadCount(@Req() req: RequestWithUser): Promise<UnreadCountResponseDto> {
    const dto = new UnreadCountResponseDto();
    dto.unreadCount = await this.notificationService.unreadCount(req.user.getId());
    return dto;
  }

  @Get('preferences')
  @ApiOperation({ summary: 'List the current user notification preferences' })
  @ApiResponse({ status: 200, type: [NotificationPreferenceResponseDto] })
  async preferences(@Req() req: RequestWithUser): Promise<NotificationPreferenceResponseDto[]> {
    const views = await this.notificationService.getPreferences(req.user.getId());
    return views.map((view) => NotificationPresentationMapper.toPreference(view));
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update a notification preference for the current user' })
  @ApiResponse({ status: 200, type: [NotificationPreferenceResponseDto] })
  async updatePreference(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceResponseDto[]> {
    const views = await this.notificationService.updatePreference(req.user.getId(), dto.type, dto.inAppEnabled);
    return views.map((view) => NotificationPresentationMapper.toPreference(view));
  }

  @Patch(':id/read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 204, description: 'Marked as read.' })
  async markRead(@Req() req: RequestWithUser, @Param('id') id: string): Promise<void> {
    await this.notificationService.markRead(req.user.getId(), id);
  }

  @Post('read-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 204, description: 'All marked as read.' })
  async markAllRead(@Req() req: RequestWithUser): Promise<void> {
    await this.notificationService.markAllRead(req.user.getId());
  }
}

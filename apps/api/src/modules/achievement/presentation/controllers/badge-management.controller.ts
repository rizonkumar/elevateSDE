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
import { AchievementService } from '../../application/achievement.service';
import { AdminBadgeResponseDto } from '../dtos/admin-badge-response.dto';
import { CreateBadgeDto } from '../dtos/create-badge.dto';
import { GrantBadgeDto } from '../dtos/grant-badge.dto';
import { AchievementPresentationMapper } from '../mappers/achievement-presentation.mapper';

@ApiTags('Badge Management')
@ApiBearerAuth()
@Controller({ path: 'admin/badges', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BadgeManagementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get()
  @ApiOperation({ summary: 'List all badges with award counts' })
  @ApiResponse({ status: 200, type: [AdminBadgeResponseDto] })
  async list(): Promise<AdminBadgeResponseDto[]> {
    const views = await this.achievementService.listBadges();
    return views.map((view) => AchievementPresentationMapper.toAdminBadge(view));
  }

  @Post()
  @ApiOperation({ summary: 'Create a badge definition' })
  @ApiResponse({ status: 201, type: AdminBadgeResponseDto })
  async create(@Body() dto: CreateBadgeDto): Promise<AdminBadgeResponseDto> {
    const view = await this.achievementService.create(dto);
    return AchievementPresentationMapper.toAdminBadge(view);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a badge definition' })
  @ApiResponse({ status: 200, type: AdminBadgeResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async update(@Param('id') id: string, @Body() dto: CreateBadgeDto): Promise<AdminBadgeResponseDto> {
    const view = await this.achievementService.update(id, dto);
    return AchievementPresentationMapper.toAdminBadge(view);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a badge definition' })
  @ApiResponse({ status: 204, description: 'Deleted.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.achievementService.delete(id);
  }

  @Post('grant')
  @HttpCode(204)
  @ApiOperation({ summary: 'Manually grant a badge to a user' })
  @ApiResponse({ status: 204, description: 'Granted.' })
  async grant(@Body() dto: GrantBadgeDto): Promise<void> {
    await this.achievementService.grant(dto.userId, dto.badgeId);
  }

  @Post('revoke')
  @HttpCode(204)
  @ApiOperation({ summary: 'Manually revoke a badge from a user' })
  @ApiResponse({ status: 204, description: 'Revoked.' })
  async revoke(@Body() dto: GrantBadgeDto): Promise<void> {
    await this.achievementService.revoke(dto.userId, dto.badgeId);
  }
}

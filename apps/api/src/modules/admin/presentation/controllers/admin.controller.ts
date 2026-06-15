import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../../../users/application/users.service';
import { AuditLogService } from '../../../audit-log/application/audit-log.service';
import { FeatureFlagService } from '../../../feature-flag/application/feature-flag.service';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { User } from '../../../users/domain/entities/user';
import { UserResponseDto } from '../../../users/presentation/dtos/user-response.dto';
import { UserPresentationMapper } from '../../../users/presentation/mappers/user-presentation.mapper';
import { TenantResponseDto } from '../dtos/tenant-response.dto';
import { AuditLogResponseDto } from '../dtos/audit-log-response.dto';
import { FeatureFlagResponseDto } from '../dtos/feature-flag-response.dto';
import { CreateFeatureFlagDto } from '../dtos/create-feature-flag.dto';
import { ToggleFeatureFlagDto } from '../dtos/toggle-feature-flag.dto';
import { UpdateRolloutDto } from '../dtos/update-rollout.dto';
import { AdminDashboardStatsDto } from '../dtos/dashboard-stats.dto';
import { AdminPresentationMapper } from '../mappers/admin-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Admin')
@ApiBearerAuth()
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogService: AuditLogService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get administrative stats' })
  @ApiResponse({ status: 200, type: AdminDashboardStatsDto })
  async getStats(): Promise<AdminDashboardStatsDto> {
    const [totalUsers, totalTenants, activeFlags] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.tenant.count(),
      this.prisma.featureFlag.count({ where: { isEnabled: true } }),
    ]);
    return {
      totalUsers,
      totalTenants,
      activeFeatureFlagsCount: activeFlags,
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all registered users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async listUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map((u) => UserPresentationMapper.toResponse(u));
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Modify role of a user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Req() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    if (req.user.getId() === id) {
      throw new ForbiddenException('You cannot change your own role');
    }
    const oldUser = await this.usersService.findById(id);
    const updated = await this.usersService.updateRole(id, role);
    await this.auditLogService.create(req.user.getId(), 'USER_ROLE_UPDATED', {
      targetUserId: id,
      oldRole: oldUser.getRole(),
      newRole: role,
    });
    return UserPresentationMapper.toResponse(updated);
  }

  @Get('tenants')
  @ApiOperation({ summary: 'List all B2B tenants' })
  @ApiResponse({ status: 200, type: [TenantResponseDto] })
  async listTenants(): Promise<TenantResponseDto[]> {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return tenants.map((t) => AdminPresentationMapper.toTenantResponse(t));
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'List all system audit logs' })
  @ApiResponse({ status: 200, type: [AuditLogResponseDto] })
  async listAuditLogs(): Promise<AuditLogResponseDto[]> {
    const logs = await this.auditLogService.findAll();
    return logs.map((l) => AdminPresentationMapper.toAuditLogResponse(l));
  }

  @Get('feature-flags')
  @ApiOperation({ summary: 'List all feature flags' })
  @ApiResponse({ status: 200, type: [FeatureFlagResponseDto] })
  async listFeatureFlags(): Promise<FeatureFlagResponseDto[]> {
    const flags = await this.featureFlagService.findAll();
    return flags.map((f) => AdminPresentationMapper.toFeatureFlagResponse(f));
  }

  @Post('feature-flags')
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiResponse({ status: 201, type: FeatureFlagResponseDto })
  async createFeatureFlag(
    @Body() dto: CreateFeatureFlagDto,
    @Req() req: RequestWithUser,
  ): Promise<FeatureFlagResponseDto> {
    const flag = await this.featureFlagService.create(
      dto.flagKey,
      dto.isEnabled,
      dto.percentageRollout,
    );
    await this.auditLogService.create(req.user.getId(), 'FEATURE_FLAG_CREATED', {
      flagKey: dto.flagKey,
      isEnabled: dto.isEnabled || false,
      percentageRollout: dto.percentageRollout || 100,
    });
    return AdminPresentationMapper.toFeatureFlagResponse(flag);
  }

  @Patch('feature-flags/:id/toggle')
  @ApiOperation({ summary: 'Toggle feature flag state' })
  @ApiResponse({ status: 200, type: FeatureFlagResponseDto })
  async toggleFeatureFlag(
    @Param('id') id: string,
    @Body() dto: ToggleFeatureFlagDto,
    @Req() req: RequestWithUser,
  ): Promise<FeatureFlagResponseDto> {
    const flag = await this.featureFlagService.toggle(id, dto.isEnabled);
    await this.auditLogService.create(req.user.getId(), 'FEATURE_FLAG_TOGGLED', {
      flagId: id,
      flagKey: flag.getFlagKey(),
      isEnabled: dto.isEnabled,
    });
    return AdminPresentationMapper.toFeatureFlagResponse(flag);
  }

  @Patch('feature-flags/:id/rollout')
  @ApiOperation({ summary: 'Update feature flag percentage rollout' })
  @ApiResponse({ status: 200, type: FeatureFlagResponseDto })
  async updateRollout(
    @Param('id') id: string,
    @Body() dto: UpdateRolloutDto,
    @Req() req: RequestWithUser,
  ): Promise<FeatureFlagResponseDto> {
    const flag = await this.featureFlagService.updateRollout(id, dto.percentageRollout);
    await this.auditLogService.create(req.user.getId(), 'FEATURE_FLAG_ROLLOUT_UPDATED', {
      flagId: id,
      flagKey: flag.getFlagKey(),
      percentageRollout: dto.percentageRollout,
    });
    return AdminPresentationMapper.toFeatureFlagResponse(flag);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { AccountReviewService } from '../../../users/application/account-review.service';
import { AuditLogService } from '../../../audit-log/application/audit-log.service';
import { User } from '../../../users/domain/entities/user';
import { PendingAccount } from '../../../users/domain/read-models/pending-account';
import { UserResponseDto } from '../../../users/presentation/dtos/user-response.dto';
import { UserPresentationMapper } from '../../../users/presentation/mappers/user-presentation.mapper';
import {
  PendingAccountCountResponseDto,
  PendingAccountListResponseDto,
  PendingAccountQueryDto,
  PendingAccountResponseDto,
  RejectAccountDto,
} from '../dtos/account-review.dto';

interface RequestWithUser {
  user: User;
}

const DEFAULT_PAGE_SIZE = 25;

@ApiTags('Admin')
@ApiBearerAuth()
@Controller({ path: 'admin/users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AccountReviewController {
  constructor(
    private readonly accountReview: AccountReviewService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('pending')
  @ApiOperation({ summary: 'List accounts awaiting approval' })
  @ApiResponse({ status: 200, type: PendingAccountListResponseDto })
  async listPending(@Query() query: PendingAccountQueryDto): Promise<PendingAccountListResponseDto> {
    const page = await this.accountReview.listPending(
      query.page ?? 1,
      query.pageSize ?? DEFAULT_PAGE_SIZE,
    );
    return { items: page.items.map(toPendingResponse), total: page.total };
  }

  @Get('pending-count')
  @ApiOperation({ summary: 'Count accounts awaiting approval' })
  @ApiResponse({ status: 200, type: PendingAccountCountResponseDto })
  async pendingCount(): Promise<PendingAccountCountResponseDto> {
    return { count: await this.accountReview.pendingCount() };
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending account' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Account was already reviewed.' })
  async approve(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    const approved = await this.accountReview.approve(req.user.getId(), id);
    await this.auditLogService.create(req.user.getId(), 'USER_APPROVED', {
      targetUserId: id,
      email: approved.getEmail(),
    });
    return UserPresentationMapper.toResponse(approved);
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending account' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Account was already reviewed.' })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectAccountDto,
    @Req() req: RequestWithUser,
  ): Promise<UserResponseDto> {
    const reason = dto.reason?.trim() || null;
    const rejected = await this.accountReview.reject(req.user.getId(), id, reason);
    await this.auditLogService.create(req.user.getId(), 'USER_REJECTED', {
      targetUserId: id,
      email: rejected.getEmail(),
      reason,
    });
    return UserPresentationMapper.toResponse(rejected);
  }
}

function toPendingResponse(account: PendingAccount): PendingAccountResponseDto {
  return {
    id: account.id,
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    role: account.role,
    companyName: account.companyName,
    signUpMethod: account.signedUpWithGoogle ? 'GOOGLE' : 'PASSWORD',
    createdAt: account.createdAt.toISOString(),
  };
}

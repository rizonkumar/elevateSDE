import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccountStatus } from '@prisma/client';
import { IUsersRepository } from '../domain/interfaces/users-repository.interface';
import { User } from '../domain/entities/user';
import { PendingAccountPage } from '../domain/read-models/pending-account';
import {
  AccountPendingApprovalEvent,
  NOTIFICATION_EVENTS,
} from '../../notification/domain/events/notification-events';
import { isOwnerAdminEmail } from '../../../infrastructure/config/security-config';

@Injectable()
export class AccountReviewService {
  private readonly logger = new Logger(AccountReviewService.name);

  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async listPending(page: number, pageSize: number): Promise<PendingAccountPage> {
    return this.usersRepository.findPendingAccounts((page - 1) * pageSize, pageSize);
  }

  async pendingCount(): Promise<number> {
    return this.usersRepository.countPendingAccounts();
  }

  async approve(reviewerId: string, userId: string): Promise<User> {
    await this.loadPendingTarget(userId);
    const reviewed = await this.usersRepository.reviewPendingAccount(userId, {
      kind: 'APPROVE',
      reviewerId,
      reviewedAt: new Date(),
    });
    return this.ensureReviewed(reviewed);
  }

  async reject(reviewerId: string, userId: string, reason: string | null): Promise<User> {
    const target = await this.loadPendingTarget(userId);
    if (isOwnerAdminEmail(target.getEmail())) {
      throw new ForbiddenException('The owner admin account cannot be rejected');
    }
    const reviewed = await this.usersRepository.reviewPendingAccount(userId, {
      kind: 'REJECT',
      reviewerId,
      reviewedAt: new Date(),
      reason,
    });
    return this.ensureReviewed(reviewed);
  }

  async announcePending(user: User): Promise<void> {
    try {
      const recipientIds = await this.usersRepository.findActiveAdminIds();
      const event: AccountPendingApprovalEvent = {
        recipientIds,
        pendingUserId: user.getId(),
        email: user.getEmail(),
      };
      this.eventEmitter.emit(NOTIFICATION_EVENTS.ACCOUNT_PENDING_APPROVAL, event);
    } catch (error) {
      this.logger.warn(`Failed to announce pending account ${user.getId()}: ${String(error)}`);
    }
  }

  private async loadPendingTarget(userId: string): Promise<User> {
    const target = await this.usersRepository.findById(userId);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.getStatus() !== AccountStatus.PENDING_APPROVAL) {
      throw new ConflictException('This account has already been reviewed');
    }
    return target;
  }

  private ensureReviewed(reviewed: User | null): User {
    if (!reviewed) {
      throw new ConflictException('This account has already been reviewed');
    }
    return reviewed;
  }
}

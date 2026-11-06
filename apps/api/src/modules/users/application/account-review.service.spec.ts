import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccountStatus, UserRole } from '@prisma/client';
import { AccountReviewService } from './account-review.service';
import { IUsersRepository } from '../domain/interfaces/users-repository.interface';
import { User } from '../domain/entities/user';
import { NOTIFICATION_EVENTS } from '../../notification/domain/events/notification-events';

function userWith(status: AccountStatus, email = 'pending@example.com'): User {
  return User.reconstitute({
    id: 'target',
    email,
    passwordHash: 'hash',
    role: UserRole.USER,
    tenantId: null,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    firstName: null,
    lastName: null,
    status,
  });
}

describe('AccountReviewService', () => {
  const original = { ...process.env };
  let repository: jest.Mocked<
    Pick<IUsersRepository, 'findById' | 'reviewPendingAccount' | 'findActiveAdminIds'>
  >;
  let emit: jest.Mock;
  let service: AccountReviewService;

  beforeEach(() => {
    repository = {
      findById: jest.fn().mockResolvedValue(userWith(AccountStatus.PENDING_APPROVAL)),
      reviewPendingAccount: jest.fn().mockResolvedValue(userWith(AccountStatus.ACTIVE)),
      findActiveAdminIds: jest.fn().mockResolvedValue(['admin-1', 'admin-2']),
    };
    emit = jest.fn();
    service = new AccountReviewService(
      repository as unknown as IUsersRepository,
      { emit } as unknown as EventEmitter2,
    );
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('approves a pending account', async () => {
    const approved = await service.approve('admin-1', 'target');

    expect(approved.getStatus()).toBe(AccountStatus.ACTIVE);
    expect(repository.reviewPendingAccount).toHaveBeenCalledWith(
      'target',
      expect.objectContaining({ kind: 'APPROVE', reviewerId: 'admin-1' }),
    );
  });

  it('records the rejection reason', async () => {
    repository.reviewPendingAccount.mockResolvedValue(userWith(AccountStatus.REJECTED));

    await service.reject('admin-1', 'target', 'Not a real person');

    expect(repository.reviewPendingAccount).toHaveBeenCalledWith(
      'target',
      expect.objectContaining({ kind: 'REJECT', reason: 'Not a real person' }),
    );
  });

  it('returns 404 for an unknown account', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.approve('admin-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to review an account twice', async () => {
    repository.findById.mockResolvedValue(userWith(AccountStatus.ACTIVE));

    await expect(service.reject('admin-1', 'target', null)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.reviewPendingAccount).not.toHaveBeenCalled();
  });

  it('reports a conflict when another admin reviewed it concurrently', async () => {
    repository.reviewPendingAccount.mockResolvedValue(null);

    await expect(service.approve('admin-1', 'target')).rejects.toBeInstanceOf(ConflictException);
  });

  it('never rejects the owner admin', async () => {
    process.env.SEED_ADMIN_EMAIL = 'owner@example.com';
    repository.findById.mockResolvedValue(
      userWith(AccountStatus.PENDING_APPROVAL, 'owner@example.com'),
    );

    await expect(service.reject('admin-1', 'target', null)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('notifies every active admin about a new pending account', async () => {
    await service.announcePending(userWith(AccountStatus.PENDING_APPROVAL));

    expect(emit).toHaveBeenCalledWith(
      NOTIFICATION_EVENTS.ACCOUNT_PENDING_APPROVAL,
      expect.objectContaining({ recipientIds: ['admin-1', 'admin-2'], pendingUserId: 'target' }),
    );
  });
});
